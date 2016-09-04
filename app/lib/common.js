function check(v){
    if(v != undefined && (v > 0 || v.length>0)){
        return true;
    }
    return false;
}
function getParameter(name) {  
    var url = document.location.href;  
    var start = url.indexOf("?")+1;  
    if (start==0) {  
        return "";  
    }  
    var value = "";  
    var queryString = url.substring(start);  
    var paraNames = queryString.split("&");  
    for (var i=0; i<paraNames.length; i++) {  
        if (name==getParameterName(paraNames[i])) {  
            value = getParameterValue(paraNames[i])  
        }  
    }  
    return value;  
} 
function getParameterName(str) {  
    var start = str.indexOf("=");  
    if (start==-1) {  
        return str;  
    }  
    return str.substring(0,start);  
}  
  
function getParameterValue(str) {  
    var start = str.indexOf("=");  
    if (start==-1) {  
        return "";  
    }  
    return str.substring(start+1);  
}  

var _search = '', _path = '';
function getRootPath(){
    var curWwwPath = window.document.location.href;
    _path = window.document.location.pathname;
    var pos = curWwwPath.lastIndexOf(_path);
    _search = window.document.location.search;
    if(pos > 8){
    	return curWwwPath.substring(0,pos);
	}
    return curWwwPath;
}

var _dirname = getRootPath();
$.ajax({
    type: 'get',
    url: _dirname + '/system/account/getsession',
    dataType: "json",
    success: function(data){
	var href = window.location.href;
    	if(data&&data.result.type == 1&&_path.indexOf('/salesman') != 0){
    		href = _dirname + '/salesman/index.html';
    	}else if(data&&data.result.type == 2&&_path.indexOf('/admin')!=0){
    		href = _dirname + '/admin/index.html';
    	}else if(data.result.type == undefined||data.result.type < 0){
    		href = _dirname + '/';
    	}
	
	if(window.location.href != href && window.location.href != href + _search){
		window.location.href = href;
	}
    }
});
