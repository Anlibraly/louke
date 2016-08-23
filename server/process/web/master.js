var koa = require('koa');
var router = require('koa-router');
var morgan = require('koa-morgan');
var session = require('koa-session');
var koaBody = require('koa-body');
var render = require('koa-ejs');
var conditional = require('koa-conditional-get');
var staticServer = require('koa-static');
var etag = require('koa-etag');
var path = require('path');

var app = koa();
var webRouter = router();

app.keys = ['louke-session-2016'];
app.use(session(app));
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
app.use(webRouter.routes());
app.use(webRouter.allowedMethods());
app.use(function *(){
	yield this.render('index',{layout:false});
});

app.listen(80);