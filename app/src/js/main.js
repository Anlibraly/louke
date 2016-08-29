$(document).ready(function(){
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

$(document).ready(function(){

});