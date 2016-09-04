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
		this.session.userid = null;
                this.session.username = null;
                this.session.nick_name = null;
                this.session.type = -1;

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
	.get('/salesman/getcustom/:status', function *() {
		let qs = null;
		if(this.params.status != undefined && this.params.status > 0){
			qs = {
				_key: 'custom',
				userid: this.session.userid,
				status: this.params.status,
				_sort: 'update_time:desc'
			};
		}else{
			qs = {
				_key: 'custom',
				userid: this.session.userid,
				_sort: 'update_time:desc'
			};
		}
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', qs))
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
	.get('/salesman/custom/:cid',function *(){
		let qs = {
				_key: 'custom',
				_id: this.params.cid,
				userid: this.session.userid
		};

		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', qs))
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
			_sort: 'contact_time:desc',
			custom_id: this.params.cid
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
		let in_data = this.request.body;
		let cid = in_data.cid,
			status = in_data.status;
		if (!cid||cid<0||typeof(cid)!='number'||!(status>0&&status<6)) {
			this.body = {
				code: -1,
				desc: '请传入正确的客户id和跟进进度'
			};	
		}
		let data = {}, 
			ctm = in_data.ctime, 
			dt = in_data.detail;
		try{
			let t = ctm.split('-');
			let d = new Date();
			d.setFullYear(+t[0]);
			d.setMonth(+t[1]-1);
			d.setDate(+t[2]);
			ctm = d.getTime();
			data.custom_id = +cid;
			data.contact_time = (ctm == undefined||ctm < 1272141884)?(+new Date()) : ctm;
			data.detail = (dt == undefined || dt.length < 1)? '暂无详情':dt;
			data.status = +status;
			data.userid = +this.session.userid;
			data.add_time = (+new Date());
			let save = [];
			save.push(data);

			yield Promise.resolve()
			.then(() => getThroughDataProc('db', 'save', {
				_key: 'contact',
				_save: save
			}))
			.then((result) => {
				save = [];
				data = {};
				data._id = +cid;
				data.add_status = +status;
				data.update_time = ctm;
				save.push(data);

				yield Promise.resolve()
				.then(() => getThroughDataProc('db', 'save', {
					_key: 'custom',
					_save: save
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
			.catch((err) => {
				console.log(`[error] ${err.message}\n${err.stack}`)
				this.body = {
					code: -1,
					desc: `[error] ${err.message}\n${err.stack}`
				};			
			});	
		}catch(e){
			this.body = {
				code: -1,
				desc: `[error] ${e.message}\n${e.stack}`
			};				
		}	
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
	})
	.get('/salesman/getlou/:lid', function *() {
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', {
			_key: 'lou',
			_id: this.params.lid
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
	.post('/salesman/soufang', function *() {
		let in_data = this.request.body;

		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'queryFang', {
			_fsize: in_data.fsize,
			_per_price: in_data.per_price,
			_total_price: in_data.total_price,
			_ftype: in_data.ftype,
			_update: in_data.update,
			_f_name: in_data.f_name
		}))
		.then((result) => {
			this.body = {
				code: 1,
				fangs: result
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
