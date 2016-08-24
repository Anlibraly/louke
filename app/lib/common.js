function getRootPath(){
    var curWwwPath = window.document.location.href;
    var pathName = window.document.location.pathname;
    var pos = curWwwPath.indexOf(pathName);
    if(pos > 8){
    	return curWwwPath.substring(0,pos);
	}
    return curWwwPath;
}

var _dirname = getRootPath();
var user_type = 0;

if(_dirname.lastIndexOf("/") == _dirname.length -1){
	_dirname = _dirname.substring(0, _dirname.length -1);
}

$.ajax({
    type: 'get',
    url: _dirname + '/system/getsession',
    dataType: "json",
    success: function(data){
    	if(data&&data.type === 1){
    		user_type = 1;
            if(window.location.href != _dirname + '/salesman/index.html'){
    	       	window.location.href = _dirname + '/salesman/index.html';
            }
    	}else if(data&&data.type === 2){
    		user_type = 2;
            if(window.location.href != _dirname + '/admin/index.html'){
    	       	window.location.href = _dirname + '/admin/index.html';
            }
    	}else{
            if(window.location.href != _dirname){
    	       	window.location.href = _dirname;
            }
    	}
    }
});
