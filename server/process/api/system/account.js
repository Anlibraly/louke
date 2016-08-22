var msg = require('../../../common/msg');

module.exports = ( router ) => {

	router
	.get('/getUserIp', function *() {

		let ip = this.req.headers['x-forwarded-for'] ||
    			 this.req.connection.remoteAddress ||
    			 this.req.socket.remoteAddress ||
    			 this.req.connection.socket.remoteAddress;

		this.body = {
			result : {ip},
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