var msg = require('../../../common/msg');

module.exports = ( router ) => {

	router
	.post('/db/reset', function *(){
		yield msg
		.send('data@db.truncateTable', this.request.body.name)
		.then((result) => (this.body = result));
	})
	.post('/db/list', function *(){
		yield msg
		.send('data@db.listDbTables')
		.then((result) => (this.body = result));
	})
	.post('/db/getAll', function *(){
		yield msg
		.send('data@db.query', {
			_key : this.request.body.name
		})
		.then((result) => (this.body = result));
	})
	.post('/db/struct', function *(){
		yield msg
		.send('data@db.listTableColumns', this.request.body.name)
		.then((result) => (this.body = result));
	})
	.post('/db/setRecord', function *(){
		let {name, type, value = {}, id} = this.request.body; 
		let save = [];

		if(type === 'create' || type === 'update'){
			try{
				value = JSON.parse(value);
			}catch(e){
				this.body = {
					res: {
						status: false,
						msg: e.message || e.toString(),
						stack: e.stack
					}
				};
				return;
			}
		}

		if((type === 'update' || type === 'delete')
			&& !id){
			this.body = {
				res: {
					status: false,
					msg: 'should pass record id'
				}
			};
			return;
		}

		if(type === 'create'){
			save = [value];
		}
		if(type === 'update' && id !== undefined){
			value._id = +id;
			save = [value];
		}
		if(type === 'delete' && id !== undefined){
			save = [+id];
		}

		yield msg
		.send('data@db.save', {
			_key: name,
			_save: save
		})
		.then((result) => (this.body = result));
	});
};