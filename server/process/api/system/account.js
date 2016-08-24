var msg = require('../../../common/msg');

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

		this.body = {
			result : {ip: ip, session: this.session},
			res : {
				status : true
			}
		};

	})
	.post('/account/login', function *() {
		yield msg
		.send('account@loginWithOauth', {
			autoCode : this.request.body.autoCode
		})
		.then( (result) => (this.body = result) );

	})
	.post('/account/logout', function *() {
		yield msg
		.send('account@logout', this.request.body)
		.then( (result) => (this.body = result) );

	})

};