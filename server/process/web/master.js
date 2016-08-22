var koa = require('koa');
var app = koa();
var render = require('koa-ejs');
var staticServer = require('koa-static');
var path = require('path');

app.use(staticServer(path.join(__dirname,'../../../../product/app/')));

app.on('error', function(err,ctx){
	console.log(err);
});

render(app, {
	root: path.join(__dirname, '../../../../product/app/'),
	layout: '__layout',
	viewExt: 'html',
	cache: false,
	debug: true
});

app.use(function *(){
	yield this.render('index',{layout:false});
});

app.listen(80);