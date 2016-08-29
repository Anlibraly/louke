var _ 		= require('underscore');
var mysql 	= require('../drives/mysql');
var helper 	= require('../helper');
var msg 	= require('../../../common/msg');

// ========================================================
// Table Action
// ========================================================
var Action = {db: {}};
Action.db.listDbTables = (req, res) => {

	mysql.listDbTables()
	.then((result) => helper.cbResponse(result, res))
	.catch((err)   => helper.cbCatch(err, res));
};

Action.db.listTableColumns = (tableKey, res) => {
	if(!tableKey){
		helper.cbCatch(new Error('table key is undefined.'), res);
		return;
	}

	mysql.listTableColumns(tableKey)
	.then((result) => helper.cbResponse(result, res))
	.catch((err)   => helper.cbCatch(err, res));
};

Action.db.truncateTable = (tableKey, res) => {
	if(!tableKey){
		helper.cbCatch(new Error('table key is undefined.'), res);
		return;
	}

	mysql.truncateTable(tableKey)
	.then((result) => {
		return Promise.resolve(result); 
	})
	.then((result) => helper.cbResponse(result, res))
	.catch((err)   => helper.cbCatch(err, res));
};

// ========================================================
// Record Action
// ========================================================
Action.db.save = (req = {}, res) => {
	if(!helper.checkModel(req._key)){
		helper.cbCatch(new Error('model not define.'), res);
		return;
	}

	let {
		_key:key = null,
		_save:save = []
	} = req;
	let {map, add, update, del} = helper.parseSaveObject(key, save);

	mysql.save({ key, add, update, del })
	.then(({ar, ur, dr}) => {
		let result = helper.createSaveObject({map, ar, ur, dr});
		return Promise.resolve(result);
	})
	.then((result) => helper.cbResponse(result, res))
	.catch((err)   => helper.cbCatch(err, res));
};


Action.db.query = (req = {}, res) => {
	if(!helper.checkModel(req._key)){
		helper.cbCatch(new Error('model not define.'), res);
		return;
	}

	let { 
		_key: key = null,
		_size: size = 0,
		_page: page = 1,
		_sort: sort = '',
		_include: include = '',
		...attrs
	} = req;

	attrs 	= helper.parseAttrs(attrs);
	sort 	= helper.parseSort(sort);
	include = helper.parseInclude(include);

	let query = { key, size, page, sort, include, attrs };

	mysql.query(query)
	.then(({rows, page, size, total}) => {
		let list = [];

		_.each(rows, (v) => {
			list.push(helper.modelValueDecode(key, v));
		});

		return Promise.resolve({list, page, size, total});
	})
	.then((result) => helper.cbResponse(result, res))
	.catch((err)   => helper.cbCatch(err, res));
};

Action.db.queryFang = (req = {}, res) => {

	let {
		_fsize: fsize = {low: -1, high: -1},
		_per_price: per_price = {low: -1, high: -1},
		_total_price: total_price = {low: -1, high: -1},
		_ftype: ftype = '',
		_update: update = false,
		_f_name: f_name = ''
	} = req;

	let query = {fsize, per_price, total_price, ftype, f_name};

	mysql.queryFang(query, update)
	.then(({rows}) => {
		let list = [];
		return Promise.resolve({rows});
	})
	.then((result) => helper.cbResponse(result, res))
	.catch((err)   => helper.cbCatch(err, res));
};

module.exports = Action;