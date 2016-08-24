function getRootPath(){
    var curWwwPath = window.document.location.href;
    var pathName = '/'+window.document.location.pathname;
    var pos = curWwwPath.indexOf(pathName);
    if(pos > 0){
    	return curWwwPath.substring(0,pos);
	}
    return curWwwPath;
}
var _dirname = getRootPath();

$.ajax({
    type: 'get',
    url: `${_dirname}/system/getsession`,
    dataType: "json",
    success: function(data){
    	if(data&&data.type === 1){
    		window.location.href = `${_dirname}/salesman/index.html`;
    	}else if(data&&data.type === 2){
    		window.location.href = `${_dirname}/admin/index.html`;
    	}else{
    		window.location.href = `${_dirname}`;
    	}
    }
});
