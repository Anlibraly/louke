$(document).ready(function(){
	bdsize();
});

function bdsize(){
	var bdWidth=$(window).width();
	var bdHeight=$(window).height()  ;
	var mainHeight=$(window).height() - 100;
	$("#wrapper").css({"width":bdWidth, "height": mainHeight});
	$("#main_wrap").css({"width":bdWidth, "height": mainHeight});
	$(".menu_bar").css({"bottom": 0});
}

$(window).resize(function(){
	bdsize();
});

$(document).ready(function(){

});