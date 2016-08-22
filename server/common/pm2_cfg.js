'use strict';

exports.servers = {
	'data': {
	    "name"        		: "data",
    	"script"      		: "product/server/process/data/master.js",
        "log_date_format"   : "YYYY-MM-DD HH:mm:ss",
    	"exec_mode"			: "cluster",
    	"instances"			: 1,
	    "out_file"  		: "./logs/data_out.log",
	    "error_file"   		: "./logs/data_err.log",
	    "log_file"   		: "./logs/data_log.log"
	},
	'api': {
		"name"        		: "api",
    	"script"      		: "./product/server/process/api/master.js",
        "log_date_format"   : "YYYY-MM-DD HH:mm:ss",
    	"exec_mode"			: "cluster",
    	"instances"			: 1,
	    "out_file"  		: "./logs/api_out.log",
	    "error_file"   		: "./logs/api_err.log",
	    "log_file"   		: "./logs/api_log.log",
		"node_args"   		: "--max-old-space-size=150 --harmony"
	},
	'web': {
		"name"        		: "web",
    	"script"      		: "./product/server/process/web/master.js",
        "log_date_format"   : "YYYY-MM-DD HH:mm:ss",
    	"exec_mode"			: "cluster",
    	"instances"			: 1,
	    "out_file"  		: "./logs/web_out.log",
	    "error_file"   		: "./logs/web_err.log",
	    "log_file"   		: "./logs/web_log.log",
		"node_args"   		: "--harmony",
		"max_memory_restart" : "300M"
	}
};

exports.ports = {
	'data': 	8100,
	'api': 		8140,
	'web': 		8180
};
