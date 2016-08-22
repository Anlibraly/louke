var _ 		  = require('underscore');
var axon 	  = require('axon');
var pm2 	  = require('pm2');
var pm2Config = require('./pm2_cfg');
var os;

// the ip of 'eth0' by family IPv4 from local machine
var getIp = () => {
	if(!os){ os = require('os'); }

    let interfaces = os.networkInterfaces();
    let IPv4 = '127.0.0.1';

    for(let key in interfaces){
      interfaces[key].forEach((details) => {
        if(details.family == 'IPv4' && key == 'eth0'){
            IPv4 = details.address;
        }
      });
    }

    return IPv4;
};

// null/undefined deliever
var toRealNullUndefined = (data) => {
	switch(data){
		case '$null$': return null;
		case '$undefined$': return undefined;
		default: return data;
	}
};

// repl => replace
var toReplNullUndefined = (data) => {
	switch(data){
		case null: return '$null$';
		case undefined: return '$undefined$';
		default: return data;
	}
};

var getProcAddr = (name) => {
	if(!name){
		throw new Error('should pass socket name');
	}

	let promises;
	let curProcess 	 = pm2Config.servers[name] || {};
	let instances 	 = (curProcess.instances || 1);
	let addrs = [];

	for(let i = 0; i < instances; i++){
		addrs.push(`0.0.0.0:${pm2Config.ports[name] + i}`);
	}

	promises = Promise.resolve(addrs);

	return promises
	.then((addrs) => {
		let len = addrs.length;
		return Promise.resolve({
			one: [addrs[_.random(0, len - 1)]],
			all: addrs
		});
	});
};

// separate 
// Object:{a: 1, b:2} => [[a, b], [1, 2]]
// or String:'sss' => [false, 'sss']
var toKeyValueArray = (data) => {
	if(!_.isObject(data)){ return [false, toReplNullUndefined(data)]; }

	let keys = [], values = [];
	for(let k in data) {
		keys.push(k);
		values.push(toReplNullUndefined(data[k]));
	}

	return [keys, ...values];
};

// toKeyValueArray contrary
var composeKeyValue = (keys, values) => {
	if(!keys){ return toRealNullUndefined(values); }

	let data = {};
	_.each(keys, (v, k) => {
		data[v] = toRealNullUndefined(values[k]);
	});

	return data;
};

var splitAddrByAt = (addr) => {
	if(!addr 
		|| addr.indexOf('@') === -1){
		return [];
	}

	return addr.split('@');
};

// a callback fn, response to socket request
var respondMessage = (args = [], action = {}) => {
	// args like action/keys:[]/...values/cb
	let reply = args.pop();
	let fnName = (args.shift() || '').split('.');
	let keys = args.shift();
	let values = (!keys ? args[0] : args);
	let data = composeKeyValue(keys, values);
	let fn;

	if(!reply || !fnName || !fnName[0]){
		console.log('reply & fnName should not be empty');
		return;
		// throw new Error('reply & fnName should not be empty');
	}

	// when action is not ready(action is `{}`), but other process call this action.[fnName]
	// there will throw error like `[fnName] of undefined`
	// so need catch it
	// by cc
	try{
		fn = fnName.length > 1 
			? action[fnName[0]][fnName[1]] 
			: action[fnName[0]];
	}catch(e){}

	if(_.isFunction(fn)){
		fn(data, reply);
	}
};

// arrangedData: [action, keys:[], ...values]
// the reason why pass ...values no [values] is to send buffer
var socketRequest = (socketAddrs = [], arrangedData = []) => {
	let sendPromises = [];

	_.each(socketAddrs, (addr) => {
		let socket = axon.socket('req');
		let sendData = _.extend([], arrangedData);

		socket.connect(`tcp://${addr}`);
		sendPromises.push(new Promise((resolve) => {
			let callback = (res) => {
				socket.close();
				socket = null;
				resolve(res);
			};

			
			// here must push callback to last, due to the axon send mechanism
			sendData.push(callback);
			socket.send.apply(socket, sendData);
		}));
	});

	if(sendPromises.length <= 1){
		return sendPromises[0];
	}else{
		return Promise.all(sendPromises);
	}
};

var actualSend = (addr, data, bygroup = false) => {
	let [name, action] = splitAddrByAt(addr);
	let maxTry = 5, tryTimes = 0, tryWait = 50;

	if(!name || !action){
		return Promise.reject('target address should like name@action format');
	}

	let separatedData = toKeyValueArray(data);
	let arrangedData = [action, ...separatedData];

	return new Promise((resolve, reject) => {
		let getOne = () => {
			Promise.resolve()
			.then(() => getProcAddr(name))
			.then((addrs) => {
				let socketAddrs = (bygroup ? addrs.all : addrs.one);
				if(addrs.one[0] === undefined &&
					tryTimes++ < maxTry){
					setTimeout(getOne, tryWait);
					return Promise.resolve();
				}

				if(addrs.all.length === 0 || addrs.one[0] === undefined){ 
					reject(`No service available: (process name: ${name})`); 
				}

				resolve(socketAddrs);
			});
		};

		getOne();
	})
	.then((socketAddrs) => socketRequest(socketAddrs, arrangedData));
};

exports.send 		= (addr, data) => actualSend(addr, data, false);
exports.sendByGroup = (addr, data) => actualSend(addr, data, true);
exports.spawnSocket = (name, pmid, action = {}) => {
	pmid = +pmid;

	if(!name){ return Promise.reject('should pass socket name'); }
	// pmid === 0 is launcher
	if(!pmid && (pmid !== 0)){ return Promise.reject('should pass socket id'); }

	let socket = axon.socket('rep');
	let curProcess 	 = pm2Config.servers[name] || {};
	let instances 	 = (curProcess.instances || 1);
	let port = pm2Config.ports[name] + (pmid % instances);

	return Promise.resolve()
	.then(() => {
		socket.bind(port);
		socket.on('message', function(){
			respondMessage(_.toArray(arguments), action);
		});

		return new Promise((resolve) => {
			pm2.connect(() => {
				pm2.list((err, list) => {
					// show socket process has running
					if(name !== 'launcher'){
						exports.send('launcher@contact', {name, port});
					}

					resolve();
				});
			});
		});
	})
	.catch((e) => console.log('spawnSocket error: ', e));
};

// compact forward
exports.contact = (name, pmid, action = {}) => {
	console.log('msg.contact would deprecated in the future, please use spawnSocket instead');
	return exports.spawnSocket(name, pmid, action);
};
global.msg = (() => {
	console.log('global.msg would deprecated in the future, please use require(msg) instead');
	return module.exports;
})();
