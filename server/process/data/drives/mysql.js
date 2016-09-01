var mysql 	 = require('mysql');
var _ 		 = require('underscore');
var s 		 = require('underscore.string');
var base64 	 = require('js-base64').Base64;
var conf 	 = require('../../../common/settings');

var pool = mysql.createPool({
	host: conf.dbHost,
	user: conf.dbUser,
	password: base64.decode(base64.decode(conf.dbPassword)),
	database: conf.dbName
});
pool.on('connection', () 	=> console.log('mysql pool connect'));
pool.on('enqueue', 	  () 	=> console.log('mysql pool waiting for available connection slot'));
pool.on('error',  	  (err)	=> console.log(`mysql pool error : ${err.code}, ${err.message}`));

// promisify mysql connection query
var promisifyQuery = (sql) => {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, conn) => {
			if(err){reject(err); return;}

			conn.query(sql, (err, rows) => {
				conn.release();

				if(err){
					reject(err);
				}else{
					resolve(rows);
				}
			});
		});
	});
};

var addRecord = (key, value) => {
	if(!value || !key){
		return Promise.resolve(false);
	}

	let [attrValues, attrKeys] = [_.values(value), _.keys(value)];

	_.each(attrValues, (v, k) => {
		attrValues[k] = String(v)
						.replace(/\\/g, '\\\\')
						.replace(/\'/g, '\\\'');
	});

	if(attrValues.length <= 0){
		return Promise.resolve(false);
	}

	let sql = `insert into ${key} (\`${attrKeys.join('\`, \`')}\`)
			   values ('${attrValues.join('\', \'')}');`;

	return Promise.resolve()
	.then(() => promisifyQuery(sql))
	.then((rows) => +rows.insertId);
};

var updateRecord = (key, value) => {
	if(!value || !key || !value._id){
		return Promise.resolve(false);
	}

	let {_id, ...attrs} = value;
	let attrList = [];

	_.each(_.pairs(attrs), (v) => {
		let filterChars = String(v[1])
						  .replace(/\\/g, '\\\\')
						  .replace(/\'/g, '\\\'');

		attrList.push(`\`${v[0]}\`='${filterChars}'`);
	});

	let sql = `update ${key}
			   set ${attrList.join(', ')}
			   where _id=${_id};`;

	return Promise.resolve()
	.then(() => promisifyQuery(sql))
	.then(() => true);
};

var delRecord = (key, _id) => {
	if(!_id || !key){
		return Promise.resolve(false);
	}

	let sql = `delete from ${key} where _id=${_id};`;

	return Promise.resolve()
	.then(() => promisifyQuery(sql))
	.then(() => true);
};

var cpiToSql = (field, cpi) => {
	if(!field || !cpi){
		throw new Error('field, cpi should not be empty');
	}

	let subsql;
	let cval  = (String(cpi.val) || '');
	let value = cval.replace(/\\/g, '\\\\')
					.replace(/\'/g, '\\\'');

	if(['>', '<', '>=', '<='].indexOf(cpi.cpi) !== -1){
		subsql = `\`${field}\` ${cpi.cpi} '${value}'`;
	}else if(cpi.cpi === '~='){
		value = value.split(';');
		value = value.join('\',\'');
		subsql = `\`${field}\` in ('${value}')`;
	}else if(cpi.cpi === '!='){
		subsql = `\`${field}\` != '${value}'`
	}else if(cpi.cpi === '*='){
		subsql = `\`${field}\` like '%${value}%'`;
	}else if(cpi.cpi === '^='){
		subsql = `\`${field}\` like '${value}%'`;
	}else if(cpi.cpi === '$='){
		subsql = `\`${field}\` like '%${value}'`;
	}else if(cpi.cpi === '=='){
		subsql = `\`${field}\` = '${value}'`;
	}
 
	return subsql;
};

var updateSql = (key, qv, upd) => {
	if (!upd==1&&qv.low>=0&&qv>0) {
		return `and ${key}='未更新' or (${key}>=${qv.low} and ${key}<${qv.high}) `;
	}else if(upd==1&&qv.low>=0&&qv.high>0){
		return `and ${key}>=${qv.low} and ${key}<${qv.high} `;
	}else if(upd==1){
		return `and ${key}!='未更新' `;
	}	
	return '';
}

module.exports = {
	getTableList(){
		this.listDbTables();
	},

	listDbTables(){
		return promisifyQuery(`select * from information_schema.tables where table_schema='louke';`);
	},

	getTableStruct(tableKey){
		this.listTableColumns(tableKey);
	},

	listTableColumns(tableKey){
		return promisifyQuery(`show columns from ${tableKey};`);
	},

	resetTable(tableKey){
		this.truncateTable(tableKey);
	},
	
	truncateTable(tableKey){
		return promisifyQuery(`truncate table ${tableKey};`);
	},

	query(query){
		let sql   = 'select ';
		let where = [];
		let sort  = [];

		// inlcude 
		query.include = (query.include || []);
		if(query.include.length === 0){
			sql += '*';
		}else{
			// 选择字段
			sql += '`'+ query.include.join('`,`') +'`';
		}

		// key
		sql += `\nfrom ${query.key}`;

		// attrs: table field filter
		_.each(query.attrs, (v, k) => {
			let subsql = [];
			
			_.each(v.cpis, (sv) => {
				subsql.push(cpiToSql(k, sv));
			});

			subsql = _.without(subsql, undefined);
			if(subsql.length > 0){
				where.push(`( ${subsql.join(` ${(v.conn || 'and')} `)} )`);
			}
		});

		if(where.length > 0){
			sql += `\nwhere ${where.join(' and ')}`;
		}

		// sort
		_.each(_.pairs(query.sort), (v) => {
			sort.push(`${v[0]} ${v[1] || 'asc'}`);
		});

		if(sort.length > 0){
			sql += `\norder by ${sort.join(', ')}`;
		}

		// page / size
		if(+query.size > 0){
			sql += `\nlimit ${query.size*(query.page-1)},${query.size}`;
		}

		sql += ';';

		let countSql = sql.split(/\n/);
		let {size, page} = query;
		let hasSize = (+size > 0 ? true : false);
		let total = 1;

		countSql.splice(0, 1, 'select count(*) as total');
		countSql.pop();
		countSql = countSql.join('\n');
		console.log(countSql);
		return Promise.resolve()
		.then(() => {
			if(hasSize){
				return promisifyQuery(countSql)
				.then((count) => {
					total = Math.ceil(+count[0]['total'] / size);
				});
			}
		})
		.then(() => promisifyQuery(sql))
		.then((rows) => ({rows, page, size, total}));
	},

	queryFang(query, update){
		let sql = 'select ';
		sql += 'f._id,f.f_name,f.lou_id,f.tel_num,f.size,f.per_price,f.total_price,l.lou_name,l.type,l.alti,l.lont,l.lou_address ';
		sql += 'from (select * from fang where 1=1 '
		sql += updateSql('size', query.fsize, update);
		sql += updateSql('per_price', query.per_price, update);
		sql += updateSql('total_price', query.total_price, update);
		sql += ') as f join (select * from lou where 1=1 '
		if(query.ftype!=undefined && query.ftype.length > 0){
			sql += `and type='${query.ftype}'`
		}		
		sql += ') as l on f.lou_id=l._id ';
		if(query.f_name!=undefined && query.f_name.length > 0){
			sql += `and (f.f_name like'%${query.f_name}%' or l.lou_name like'%${query.f_name}%') `;
		}
		sql += ' order by f.lou_id;';
		console.log(sql);
		return Promise.resolve()
		.then(() => promisifyQuery(sql))
		.then((rows) => ({rows}));
	},

	save({ key, add, update, del }){
		let savePromise = [];
		let saveResult = {ar: [], ur: [], dr: []};
		let done = () => Promise.resolve(saveResult);

		return Promise.resolve()
		.then(() => {
			_.each(add, (v, k) => savePromise.push(
				addRecord(key, v)
				.then((r) 	=> (saveResult.ar[k] = r))
				.catch((e) 	=> (saveResult.ar[k] = false))
			));

			_.each(update, (v, k) => savePromise.push(
				updateRecord(key, v)
				.then((r) 	=> (saveResult.ur[k] = r))
				.catch((e) 	=> (saveResult.ur[k] = false))
			));

			_.each(del, (v, k) => savePromise.push(
				delRecord(key, v)
				.then((r) 	=> (saveResult.dr[k] = r))
				.catch((e) 	=> (saveResult.dr[k] = false))
			));
		})
		.then(() => Promise.all(savePromise))
		.then(done, done);
	}
};