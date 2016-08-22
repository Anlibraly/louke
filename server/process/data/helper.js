var _ 	  = require('underscore');
var s 	  = require('underscore.string');
var model = require('../../common/model');

var modelAllowType = [Number, Boolean, String, Array];
var valueTransform = {
	encode: {
		Number:  (val) => +val || 0,
		Boolean: (val) => val ? 1 : 0,
		String:  (val) => {
			if(_.isObject(val) || _.isArray(val)){
                return JSON.stringify(val);
            }else{
                return String(val);
            }
		},
		Array: (val) => _.isString(val) ? val : JSON.stringify(val)
	},
	decode: {
		Number:  (val) => +val || 0,
		Boolean: (val) => (+val === 1) ? true : false,
		String:  (val) => String(val),
		Array:   (val) => _.isArray(val) ? val : JSON.parse(val)
	}
};

var parseQueryCondi = (condi) => {
	if(/^>=/.test(condi)){
    	return ['>=', condi.replace(/^>=/, '')];
    }else if(/^<=/.test(condi)) {
    	return ['<=', condi.replace(/^<=/, '')];
    }else if(/^>/.test(condi)) {
    	return ['>', condi.replace(/^>/, '')];
    }else if(/^</.test(condi)){
    	return ['<', condi.replace(/^</, '')];
    }else if(/^\~=/.test(condi)){
    	return ['~=', condi.replace(/^\~=/, '')];
    }else if(/^!/.test(condi)){
    	return ['!=', condi.replace(/^!/, '')];
    }else if( /^\*=/.test(condi)){
    	return ['*=', condi.replace(/^\*=/, '')];
    }else if( /^\^=/.test(condi)){
    	return ['^=', condi.replace(/^\^=/, '')];
    }else if( /^\$=/.test(condi)){
    	return ['$=', condi.replace(/^\$=/, '')];
    }else{
    	return ['==', condi.replace(/^=/, '')];
    }
};

module.exports = {
	cbResponse(result, cb, status = true){
		cb({
			result,
			res: {status}
		});
	},

	cbCatch(err, cb){
		cb({
			res: {
				status: false,
				msg: err.message,
				stack: err.stack
			}
		});
	},

	isBlockCheck(list, space){
		let result = {
            res: {status: false}
        };

        _.find(list, (v) => {
            if(v.name === space){
                if(v.block === false){
                    result.res.status = true;
                }else{
                    throw new Error('space is blocked');
                }

                return true;
            }
        });

        if(result.res.status === false){
            throw new Error('space is not found');
        }

        return Promise.resolve(result);
	},

	getModel(modelKey){
		let theModel;

		_.find(model, (v, k) => {
			if (modelKey.toLowerCase() === k.toLowerCase()){
				theModel = v;
				return true;
			} 
		});

		return theModel;
	},

	checkModel(modelKey){
		let modelkeys = _.keys(model);

		modelkeys = _.map(modelkeys, (v) => v.toLowerCase());
		return (modelkeys.indexOf(modelKey.toLowerCase()) !== -1);
	},

	parseInclude(include){
		let result = [];

		_.each(include.split(';'), (v) => {
			v = s(v).trim().value();

			if(v === '') return;
			result.push(v);
		});

		return result;
	},

	parseSort(sort){
		let result = {};

		_.each(sort.split(';'), (v) => {
			v = s(v).trim().value();

			if(v === '') return;

			v = v.split(':');
			result[v[0]] = v[1] || 'asc';
		});

		return result;
	},

	// attrs is like {_id:'~=1;3;5'}
	parseAttrs(attrs){
		let result = {};

		_.each(attrs, (v, k) => {
			let cpis = [];
			let conn = 'and';

			if(/\|\|/.test(v)){
				conn = 'or';
			}

			v = String(v).split(/\&\&|\|\|/);

			_.each(v, (sv) => {
				let preResult;

				sv = s(sv).trim().value();

				if((/^_/).test(k) && k !== '_id'){
	                return;
	            }else{
	            	preResult = parseQueryCondi(sv);
	            }

	            let [ cpi, val ] = preResult;
	            cpis.push({cpi, val});
			});

			result[k] = {conn, cpis};
		});

		return result;
	},

	parseSaveObject(key, save){
		let [map, add, update, del] = [{fail:[]}, [], [], []];

		_.each(save, (v, k) => {
			if(_.isObject(v)){
				if(v._id ){
					update.push(this.modelValueEncode(key, v, false ));
					map[`u:${update.length - 1}`] = k;
				}else{
					add.push(this.modelValueEncode(key, v, true ));
					map[`a:${add.length - 1}`] = k;
				}
			}else if(!isNaN(+v)){
				del.push(+v);
				map[`d:${del.length - 1}`] = k;
			}else{
				map.fail.push(k);
			}
		});

		return {map, add, update, del};
	},

	createSaveObject({map, ar, ur, dr}){
		let result = [];

		_.each(ar, (v, k) => (result[map[`a:${k}`]] = v));
		_.each(ur, (v, k) => (result[map[`u:${k}`]] = v));
		_.each(dr, (v, k) => (result[map[`d:${k}`]] = v));
		_.each(map.fail, (v) => (result[v] = false) );

		return result;
	},

	// set default and exclude attr
	modelValueFilter(model, record, complete){
		let result = {};
		let keys = _.keys(model);

		if(!complete){
			keys = _.intersection(_.keys(record), keys);
		}

		_.each(keys, (v) => {
			if(/^_/.test(v)) return;
			// set default
			if(record[v] !== undefined){
				result[v] = record[v];
			}else if( _.isObject(model[v])){
				result[v] = model[v].default;
			}else{
				result[v] = undefined;
			}
		});

		return result;
	},

	// type transform
	modelValueTransform(codeType, modelKey, record, complete){
		let modelDefine = this.getModel(modelKey);
		let _id = record._id;
		let result = this.modelValueFilter(modelDefine, record, complete);

		_.each(result, (v, k) => {
			// type change
			let type = String;
			let attrDefine = modelDefine[k];

			if(modelAllowType.indexOf(attrDefine) !== -1){
				type = attrDefine;
			}else if(attrDefine){
				type = attrDefine.type || String;
			}
			
			result[k] = valueTransform[codeType][type.name]( v );
		});

		if(+_id > 0){
			result._id = +_id;
		}

		return result;
	},

	modelValueDecode(modelKey, records = []){
		let many = _.isArray(records);
		let result = [];

		if(many){
			_.each(records, (v) => result.push(this.modelValueTransform('decode', modelKey, v)));
		}else{
			result = this.modelValueTransform('decode', modelKey, records);
		}

		return result;
	},

	modelValueEncode( modelKey, records = [], complete = false ){
		let many = _.isArray(records);
		let result = [];

		if(many){
			_.each(records, (v) => result.push(this.modelValueTransform('encode', modelKey, v, complete)));
		}else{
			result = this.modelValueTransform('encode', modelKey, records, complete);
		}

		return result;
	}
};