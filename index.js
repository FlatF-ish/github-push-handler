const express = require('express'),
	  app = express(),
	  http = require('http').Server(app),
	  bodyParser = require('body-parser'),
	  util = require('util'),
	  exec = util.promisify(require('child_process').exec),
	  crypto = require('crypto');

const PORT = process.env.PORT || 3000
/*
commands:
	branchName: Command to run

locations:
	branchName: Directory to run command in, else it'll use:

defaultLocation: As implied.

secret: Github hook secret

doPrints: Should messages like "[WEBHOOK_LISTENER] Got push from master" be logged in console

*/

var CONFIG = {
	commands: {
		"master": "./buildMaster.sh",
		"test-release": "./buildRelease.sh"
	},
	locations: {
	},
	defaultLocation: "../",
	secret: "mysecret",
	doPrints: true
}

// If GITHUB_WEBHOOK_SECRET envinment var defined, make secret that
CONFIG.secret = process.env.GITHUB_WEBHOOK_SECRET || CONFIG.secret

http.listen(PORT, function(){
  	console.log('listening on *:'+PORT);
});

// Log with header if CONFIG.doPrints
function logc(msg, printAnyway) {
	if( CONFIG.doPrints || printAnyway ){
		console.log("[WEBHOOK_LISTENER] " + msg);
	}
}

// Express doesn't give raw body anymore, so here is it
app.use(bodyParser.json({
    verify: function(req, res, buf, encoding) {
        req.rawBody = buf.toString();
    }
}));

// Generate sha1 digest of content and compare to signature
function checkSecret(data, sig) {
	let ownSig = "sha1=" + crypto.createHmac('sha1', CONFIG.secret).update(data).digest('hex');
    return ownSig == sig;
}

// !undefined gives error, so enforce that can't happen
if( CONFIG.secret === undefined ) { CONFIG.secret = false; }

app.post("/", async function(req, res) {
	var isValid = (!CONFIG.secret) || checkSecret(req.rawBody, req.headers['x-hub-signature']);
	if( !isValid ) {
		res.status(403).send("Forbidden");
		return;
	}

	if( req.body.zen ) {
		logc("Got ping from GitHub:");
		logc(req.body.zen);
		res.status(200).send("Ping successful!");
	}

	var ref = req.body.ref;
	if( !ref ) { return; }
	var branch = ref.substring(11);
	var cmd = CONFIG.commands[branch];
	if( cmd ) {
		res.status(200).send("Updating " + branch);
		logc("Got push from " + branch);
		var location = CONFIG.locations[branch];
		var preText = "cd \"" + CONFIG.defaultLocation + "\" && ";
		if( location ) {
			preText = "cd \"" + location + "\" && ";
			logc("Moving to " + location);
		}
		logc("Running: " + cmd);
		const { stdout, stderr } = await exec(preText + cmd);
		if( stderr ) {
			logc("Error running command for " + branch + ":", true);
			console.log(stderr);
		} else {
			logc(branch + " command successful");
		}
	} else {
		res.status(201).send("Branch not watched");
	}
})