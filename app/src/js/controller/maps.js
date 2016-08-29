
var mySearch = angular.module("mySearch",[]);
mySearch.controller("searchBlock",function($scope){
		// 百度地图API功能
	setTimeout(function(){
		var map = new BMap.Map("allmap");
		map.centerAndZoom(new BMap.Point(121.5, 33.5, 12));
		map.enableScrollWheelZoom();	
		bdsize();
		var opts = {
		  width : 200,     // 信息窗口宽度
		  height: 100,     // 信息窗口高度
		  title : "机构信息", // 信息窗口标题
		  enableMessage:true,//设置允许信息窗发送短息
		  message:"机构信息"
		};		
	},800);

	$scope.searchValue = "";
});
function bdsize(){
	var bdWidth=$(window).width() ;
	var bdHeight=$(window).height()  ;
	var mainHeight=$(window).height() - 62;
	$("#wrapper").css({"width":bdWidth, "height": bdHeight});
	$("#main_wrap").css({"width":bdWidth, "height": mainHeight});
}