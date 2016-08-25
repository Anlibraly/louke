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

if(_dirname.lastIndexOf("/") == _dirname.length -1){
	_dirname = _dirname.substring(0, _dirname.length -1);
}

$.ajax({
    type: 'get',
    url: _dirname + '/system/getsession',
    dataType: "json",
    success: function(data){
	var href = '';
    	if(data&&data.result.type === 1){
    		href = _dirname + '/salesman/index.html';
    	}else if(data&&data.result.type === 2){
    		href = _dirname + '/admin/index.html';
    	}else{
    		href = _dirname + '/'
    	}
	
	if(window.location.href != href){
		window.location.href = href;
	}
    }
});
