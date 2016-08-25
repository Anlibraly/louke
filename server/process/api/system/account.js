var msg = require('../../../common/msg');
var _   = require('underscore');
var md5 = require('md5');

var getThroughDataProc = (type, optype, sendData) => {
	return msg.send(`data@${type}.${optype}`, sendData)
	.then(({result, res}) => {
		return Promise.resolve(result);
	});
};

module.exports = ( router ) => {

	router
	.get('/account/getUserIp', function *() {

		let ip = this.req.headers['x-forwarded-for'] ||
    			 this.req.connection.remoteAddress ||
    			 this.req.socket.remoteAddress ||
    			 this.req.connection.socket.remoteAddress;

    	this.session.userip = ip;

		this.body = {
			result : {ip: ip},
			res : {
				status : true
			}
		};

	})
	.get('/account/getsession',function *(){

		this.body = {
			result : {type: this.session.type, id: this.session.userid},
			res : {
				status : true
			}
		};		
		
	})
	.get('/account/logout', function *() {
		this.session = {};
		this.redirect('/');
	})
	.post('/account/login', function *() {
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', {
			_key: 'user',
			username: this.request.body.username,
			password: this.request.body.password
		}))
		.then((result) => {
			let hasResult = (result.list && result.list.length);
			let user = null;
			if(hasResult && result.list[0]){
				user = result.list[0];
				this.session.userid = user._id;
				this.session.username = user.username;
				this.session.nick_name = user.nick_name;
				this.session.type = user.type;
				let des = '/salesman/index.html';
				if(user.type === 2){
					des = '/admin/index.html';
				}
				this.body = {
					code: 1,
					desc: des
				};				
			}else{
				this.body = {
					code: -1,
					desc: '用户名密码错误'
				};
			}
		})
		.catch((err) => {
			console.log(`[error] ${err.message}\n${err.stack}`)
			this.body = {
				code: -1,
				desc: `[error] ${err.message}\n${err.stack}`
			};			
		});
	})
	.get('/admin/', function *() {

	})
	.get('/salesman/getcustom', function *() {
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', {
			_key: 'custom',
			userid: this.session.userid,
		}))
		.then((result) => {
			this.body = {
				code: 1,
				customs: result.list
			};				
		})
		.catch((err) => {
			console.log(`[error] ${err.message}\n${err.stack}`)
			this.body = {
				code: -1,
				desc: `[error] ${err.message}\n${err.stack}`
			};			
		});		
	})
	.get('/salesman/getcotact/:cid', function *() {
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', {
			_key: 'contact',
			custom_id: this.params.cid,
			sort: {'contact_time': 'desc'}
		}))
		.then((result) => {
			this.body = {
				code: 1,
				contacts: result.list
			};				
		})
		.catch((err) => {
			console.log(`[error] ${err.message}\n${err.stack}`)
			this.body = {
				code: -1,
				desc: `[error] ${err.message}\n${err.stack}`
			};			
		});		
	})
	.post('/salesman/addcotact', function *() {
		var in_data = this.request.body;
		var cid = in_data.cid,
			status = in_data.status;
		if (!cid||cid<0||typeof(cid)!='number'||!(status>0&&status<6)) {
			this.body = {
				code: -1,
				desc: '请传入正确的客户id和跟进进度'
			};	
		}
		var data = {}, 
			ctm = in_data.ctime, 
			dt = in_data.detail;

		data.custom_id = cid;
		data.contact_time = (ctm == undefined||ctm < 1272141884)?(+new Date()) : ctm;
		data.detail = (dt == undefined || dt.length < 1)? '暂无详情':dt;
		data.status = status;
		data.userid = this.session.userid;
		data.add_time = (+new Date());

		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'save', {
			_key: 'contact',
			_save: data
		}))
		.then((result) => {
			this.body = {
				code: 1,
				desc: '添加成功'
			};				
		})
		.catch((err) => {
			console.log(`[error] ${err.message}\n${err.stack}`)
			this.body = {
				code: -1,
				desc: `[error] ${err.message}\n${err.stack}`
			};			
		});		
	})
	.get('/salesman/getfang/:fid', function *() {
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', {
			_key: 'fang',
			_id: this.params.fid
		}))
		.then((result) => {
			this.body = {
				code: 1,
				contacts: result.list
			};				
		})
		.catch((err) => {
			console.log(`[error] ${err.message}\n${err.stack}`)
			this.body = {
				code: -1,
				desc: `[error] ${err.message}\n${err.stack}`
			};			
		});		
	});

};