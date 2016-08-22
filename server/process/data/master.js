var extend 			= require('node.extend');
var msg 			= require('../../common/msg');
var pmid 			= process.env.pm_id;
var action 			= {};
// ================================================================================
// Socket / server
// ================================================================================
Promise.resolve()
.then(() => msg.spawnSocket('data', pmid, action))
.then(()=>{
	extend.apply(this, [
		true,
		action,
		require('./services/db.js'),
	]);
})
.catch((err) => console.log(`[error] ${err.message}\n${err.stack}`));