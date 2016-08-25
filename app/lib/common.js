var _search = '';
function getRootPath(){
    var curWwwPath = window.document.location.href;
    var pathName = window.document.location.pathname;
    var pos = curWwwPath.lastIndexOf(pathName);
    _search = window.document.location.search;
    if(pos > 8){
    	return curWwwPath.substring(0,pos);
	}
    return curWwwPath;
}
var _dirname = getRootPath();

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
    		href = _dirname + '/';
    	}
	
	if(window.location.href != href && window.location.href != href + _search){
		window.location.href = href;
	}
    }
});
