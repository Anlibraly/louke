var msg = require('../../../common/msg');
var _   = require('underscore');
var md5 = require('md5');

var check = (v) => {
    if(v != undefined && (v > 0 || v.length>0)){
        return true;
    }
    return false;
}

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
	.get('/admin/getcustom/:status/:sid', function *() {
		let qs = null;
		if(this.params.status != undefined && this.params.status > 0){
			qs = {
				_key: 'custom',
				status: this.params.status,
				_sort: 'update_time:desc'
			};
		}else{
			qs = {
				_key: 'custom',
				_sort: 'update_time:desc'
			};
		}
		if(this.params.sid != undefined && this.params.sid > 0){
			qs.userid = +this.params.sid;
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
	.get('/admin/custom/:cid',function *(){
		let qs = {
				_key: 'custom',
				_id: this.params.cid
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
	.get('/admin/getSalesman',function *(){
		let qs = {
				_key: 'user',
				type: 1
		};
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'query', qs))
		.then((result) => {
			let saleMans = [];
			_.each(result.list, (v) => {
				saleMans.push({
					_id: v._id,
					username: v.username,
					nick_name: v.nick_name
				});
			})
			this.body = {
				code: 1,
				salesmans: saleMans
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
	.post('/admin/addCustom',function *(){
		let {cname, tel_num, goal_fang, job, size,
			 price, deadline, reason, now_address,
			 other_mark, salesman, _id} = this.request.body;
		let desc = '添加成功';
		let date = new Date();
		if(check(cname) && check(tel_num) && check(goal_fang) && check(size)
		&& check(price) && check(deadline) && check(reason) && check(salesman)){
			let addtime = date.getTime();
			let t = deadline.split('-');
			if(t.length == 3){
				date.setFullYear(+t[0]);
				date.setMonth(+t[1]-1);
				date.setDate(+t[2]);
			}			
			let custom = {
			  	userid: +salesman,
			  	cname: cname,
			  	tel_num: ''+tel_num,
			  	goal_fang: goal_fang,
			  	goal_fang_id: -1,
			  	job: job == undefined ? '' : job,
			  	size: size+'',
			  	price: price+'',
			  	deadline: +date.getTime(),
			  	move_reason: reason,
			  	now_address: now_address == undefined ? '' : now_address,
			  	other_mark: other_mark == undefined ? '' : other_mark,
			  	update_time: +addtime,
			  	add_time: +addtime,
			  	status: 0,
			  	add_status: 0
			};
			if(_id !== null && _id !== undefined && +_id >=0){
				custom._id = _id;
				desc = '修改成功';
			}
			let qs = {
					_key: 'custom',
					_save: [custom]
			};
			yield Promise.resolve()
			.then(() => getThroughDataProc('db', 'save', qs))
			.then((result) => {
				this.body = {
					code: 1,
					desc: desc
				};				
			})
			.catch((err) => {
				console.log(`[error] ${err.message}\n${err.stack}`)
				this.body = {
					code: -1,
					desc: `[error] ${err.message}\n${err.stack}`
				};			
			});
		}else{
			this.body = {
				code: 1,
				desc: '请输入完整客户信息'
			};				
		}		
	})
	.post('/admin/updateCustom',function *(){
		let qs = {
				_key: 'custom',
				_save: [{
					_id: +this.request.body.userid,
					userid: +this.request.body.salesman
				}]
		};
		yield Promise.resolve()
		.then(() => getThroughDataProc('db', 'save', qs))
		.then((result) => {
			this.body = {
				code: 1,
				desc: '更新成功'
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
	.get('/admin/getcotact/:cid', function *() {
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
			.then((result) => getThroughDataProc('db', 'save', {
					_key: 'custom',
					_save: [{
						_id: +cid,
						status: +status,
						update_time: ctm						
					}]
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
