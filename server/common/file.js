var fs = require('fs');
var iconv = require('iconv-lite');
var path = require('path');
var rimraf = require('rimraf');
var minimatch = require('minimatch');

var pathSeparatorRe = /[\/\\]/g;


// What "kind" is a value?
// I really need to rework https://github.com/cowboy/javascript-getclass
var kindsOf = {};
'Number String Boolean Function RegExp Array Date Error'.split(' ').forEach(function(k) {
  kindsOf['[object ' + k + ']'] = k.toLowerCase();
});
/* istanbul ignore next */
var kindOfFn = function(value) {
  // Null or undefined.
  if (value == null) { return String(value); }
  // Everything else.
  return kindsOf[kindsOf.toString.call(value)] || 'object';
};
/* istanbul ignore next */
var file = {

	exists : function() {
	 	var filepath = path.join.apply(path, arguments);
	  	return fs.existsSync(filepath);
	},

	read : function(path, options) {
		options = options || {encoding: null};
		var contents = fs.readFileSync(String(path));
    if (options.encoding !== null) {
      contents = iconv.decode(contents, options.encoding || 'utf8');
      if (contents.charCodeAt(0) === 0xFEFF) {
        contents = contents.substring(1);
      }
    }
		return contents;
	},

	readJSON : function(filepath, options) {
		var src = this.read(filepath, options);
  		try {
		    return JSON.parse(src);
		} catch(e) {
    		console.log('Unable to parse "' + filepath + '" file (' + e.message + ').', e);
		    return ;
		}
	},

	mkdir : function(dirpath, mode) {
		var self = this;
		if (mode === null) {
			mode = parseInt('0777', 8) & (~process.umask());
	 	}
  		dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
    		parts += part + '/';
    		var subpath = path.resolve(parts);
    		if (!self.exists(subpath)) {
		    	try {
		    		fs.mkdirSync(subpath, mode);
		      	} catch(e) {
        			console.log('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e);
		   		}
    		}
   			return parts;
  		}, '');
	},

	write : function(filepath, contents, options) {
  		if (!options) { options = {}; }
  		this.mkdir(path.dirname(filepath));
  		// Create path, if necessary.
  		this.mkdir(path.dirname(filepath));
  		
  		try {
		    // If contents is already a Buffer, don't try to encode it. If no encoding
		    // was specified, use the default.
    		if (!Buffer.isBuffer(contents)) {
      			contents = iconv.encode(contents, options.encoding || 'utf8');
    		}
    		// Actually write file.
	      	fs.writeFileSync(filepath, contents);
    		return true;
	  	} catch(e) {
		   	console.log('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').', e);
	  	}
	},

	copy : function(srcpath, destpath, options) {
  		if (!options) { options = {}; }
  		// If a process function was specified, and noProcess isn't true or doesn't
  		// match the srcpath, process the file's source.
  		var process = options.process && options.noProcess !== true &&
    	!(options.noProcess && this.isMatch(options.noProcess, srcpath));
  		// If the file will be processed, use the encoding as-specified. Otherwise,
  		// use an encoding of null to force the file to be read/written as a Buffer.
  		var readWriteOptions = process ? options : {encoding: null};
  		// Actually read the file.
  		var contents = this.read(srcpath, readWriteOptions);
  		if (process) {
    		try {
      			contents = options.process(contents, srcpath);
    		} catch(e) {
      			console.log('Error while processing "' + srcpath + '" file.', e);
    		}
  		}
  		// Abort copy if the process function returns false.
  		if (contents === false) {
    		console.log('Write aborted.');
  		} else {
    		this.write(destpath, contents, readWriteOptions);
  		}
	},

	delete : function(filepath, options) {
  	
  		filepath = String(filepath);
      options = options || {force:false};

  		if (!this.exists(filepath)) {
		    return false;
  		}

  		// Only delete cwd or outside cwd if --force enabled. Be careful, people!
  		if (!options.force) {
    		if (this.isPathCwd(filepath)) {
			    console.log('Cannot delete the current working directory.');
			    return false;
	    	} else if (!this.isPathInCwd(filepath)) {
	      		console.log('Cannot delete files outside the current working directory.');
	      		return false;
	    	}
  		}

  		try {
    		// Actually delete. Or not.
      		rimraf.sync(filepath);
    		return true;
  		} catch(e) {
    		console.log('Unable to delete "' + filepath + '" file (' + e.message + ').', e);
      		return false;
  		}
	},

	recurse : function (rootdir, callback, subdir) {

  		var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
  		var self = this;

  		fs.readdirSync(abspath).forEach(function(filename) {
    		var filepath = path.join(abspath, filename);
		    if (fs.statSync(filepath).isDirectory()) {
		    	self.recurse(rootdir, callback, path.join(subdir || '', filename || ''));
		    } else {
		      	callback(filepath, rootdir, subdir, filename);
		    }
  		});
	},

	arePathsEquivalent : function(first) {
  		first = path.resolve(first);
  		for (var i = 1; i < arguments.length; i++) {
    		if (first !== path.resolve(arguments[i])) { return false; }
  		}
  		return true;
	},

	isFile : function() {
  		var filepath = path.join.apply(path, arguments);
  		return this.exists(filepath) && fs.statSync(filepath).isFile();
	},

	isDir : function() {
  		var filepath = path.join.apply(path, arguments);
  		return this.exists(filepath) && fs.statSync(filepath).isDirectory();
	},

	isPathCwd : function() {
  		var filepath = path.join.apply(path, arguments);
  		try {
    		return this.arePathsEquivalent(fs.realpathSync(process.cwd()), fs.realpathSync(filepath));
  		} catch(e) {
    		return false;
  		}
	},
  // Test to see if a filepath is contained within the CWD.
 isPathInCwd : function() {
    var filepath = path.join.apply(path, arguments);
    try {
      return this.doesPathContain(fs.realpathSync(process.cwd()), fs.realpathSync(filepath));
    } catch(e) {
      return false;
    }
  },

  // Are descendant path(s) contained within ancestor path? Note: does not test
  // if paths actually exist.
  doesPathContain : function(ancestor) {
    ancestor = path.resolve(ancestor);
    var relative;
    
    for (var i = 1; i < arguments.length; i++) {
      relative = path.relative(path.resolve(arguments[i]), ancestor);
      if (relative === '' || /\w+/.test(relative)) { return false; }
    }
    
    return true;
  },

	match : function(options, patterns, filepaths) {
  		if (kindOfFn(options) !== 'object') {
    		filepaths = patterns;
    		patterns = options;
    		options = {};
  		}
  		// Return empty set if either patterns or filepaths was omitted.
  		if (patterns == null || filepaths == null) { return []; }
  		// Normalize patterns and filepaths to arrays.
  		if (!Array.isArray(patterns)) { patterns = [patterns]; }
  		if (!Array.isArray(filepaths)) { filepaths = [filepaths]; }
  		// Return empty set if there are no patterns or filepaths.
  		if (patterns.length === 0 || filepaths.length === 0) { return []; }
  		// Return all matching filepaths.
  		return processPatterns(patterns, function(pattern) {
    		return minimatch.match(filepaths, pattern, options);
  		});
	},

	isMatch : function() {
  		return this.match.apply(this, arguments).length > 0;
	}

};

module.exports = file;