var msg = require('../../../common/msg');
var _   = require('underscore');
var md5 = require('md5');

var getThroughDataProc = (type, optype, sendData) => {
	return msg.send(`data@${type}.${optype}`, sendData)
	.then(({result, res}) => {
		if(!res.status){
			throw new Error(res.msg);
		}
		return Promise.resolve(result);
	});
};

module.exports = ( router ) => {

	router
	.get('/getUserIp', function *() {

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
	.get('/getip',function *(){

		this.body = {
			result : {ip: this.session.userip},
			res : {
				status : true
			}
		};		
		
	})
	.post('/account/login', function *() {
		Promise.resolve()
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
				this.session.nick_name = username.nick_name;
				this.session.type = user.type;
				let des = '/salesman/index.html';
				if(type === 2){
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
	.post('/account/logout', function *() {
		this.session = null;
		this.render('/');
	})

};