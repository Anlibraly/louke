module.exports = {

	contact : {
		_remote: 'db',
	  	custom_id: Number,
	    contact_time: Number,
	    detail: String,
	    userid: Number,
	    status: Number ,
	    add_time: Number
	},

	custom : {
		_remote: 'db',
	  	userid: Number,
	  	cname: String,
	  	tel_num: String,
	  	goal_fang: String,
	  	goal_fang_id: Number,
	  	job: String,
	  	size: String,
	  	price: String,
	  	deadline: Number,
	  	move_reason: String,
	  	now_address: String,
	  	other_mark: String,
	  	add_time: Number,
	  	status: Number
  	},

	fang : {
		_remote: 'db',
		f_name: String,
		lou_id: Number,
		tel_num: String,
		size: String,
		per_price: String,
		total_price: String,
		time: String
	},

	lou : {
		_remote : 'db',
		lou_name : String,
		lou_address : String,
		type : String,
		alti : String,
		lont : String
	},

	user : {
		_remote : 'db',
		password : String,
		username : String,
		nick_name : String,
		type : Number,
		oauth_username : String,
	}
}