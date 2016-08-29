$(document).ready(function(){
	var map = new BMap.Map("allmap");
	var orgs = '${areaArray}';
	var areas = '${areaListArray}';
	var uAreas = [];
	var marks = [];
	var locs = [];
	var userid = -1,data_userid=-1,data_time=-1,type=0;
	var last = false;
	var startPoint,locPolygon,markerClusterer;
	var opts = {
	  width : 200,     // 信息窗口宽度
	  height: 100,     // 信息窗口高度
	  title : "机构信息", // 信息窗口标题
	  enableMessage:true,//设置允许信息窗发送短息
	  message:"机构信息"
	};
	map.centerAndZoom(new BMap.Point(121.5, 33.5), 12);
	map.enableScrollWheelZoom();	
	bdsize();
});

function bdsize(){
	var bdWidth=$(window).width() ;
	var bdHeight=$(window).height()  ;
	var mainHeight=$(window).height() - 62;
	$("#wrapper").css({"width":bdWidth, "height": bdHeight});
	$("#main_wrap").css({"width":bdWidth, "height": mainHeight});
}

$(window).resize(function(){
	bdsize();
});
