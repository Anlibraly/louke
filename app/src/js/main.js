$(document).ready(function(){
	bdsize();
});

function bdsize(){
	var bdWidth=$(window).width();
	var bdHeight=$(window).height()  ;
	var mainHeight=$(window).height() - 62;
	$("#wrapper").css({"width":bdWidth*0.98, "height": mainHeight});
	$("#main_wrap").css({"width":bdWidth*0.98, "height": mainHeight});
	$(".menu_bar").css({"bottom": 0});
}

$(window).resize(function(){
	bdsize();
});

$(document).ready(function(){

});