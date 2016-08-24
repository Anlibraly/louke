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
var msg = require('../../common/msg');

var pmid = process.env.pm_id;
var app = koa();
var webRouter 	 = router();

var webServer = () => {

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
		})
		.use(morgan.middleware('dev'))
		.use(conditional())
		.use(etag())
		.use(koaBody({
			jsonLimit : '10mb',
			formLimit : '10mb',
			textLimit : '10mb'
		}))
		.use(function *(next){
			this.response.set('louke-server', `web/${pmid}`);
			yield next;
		})
		.use(webRouter.routes())
		.use(webRouter.allowedMethods());

	app.listen(80);

}

Promise.resolve()
.then(() => msg.spawnSocket('web', pmid, {}))
.then(() => {
	webServer();
})
.catch((err) => console.log(`[error] ${err.message}\n${err.stack}`));
