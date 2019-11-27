# github-push-handler
A simple, lightweight NodeJS Github push webhook handler.

## Features
- Trigger console commands in specified location on branch by branch basis.
- Supports secrets.
- Lightweight, only requires `express`.

## Setup
### Config
Modify the `CONFIG` table in `index.js`. The fields mean:
- commands: A table where the key is a branch name, value is a command to run
- locations: A table where the key is a branch name, value is a location to move to before running command. (Relative to index.js, fully optional)
- defaultLocation: Default location to run commands, used when no location specified for a branch. (Relative to index.js, optional)
- secret: Github webhook secret, this will use the environment variable `GITHUB_WEBHOOK_SECRET` if defined. (optional, but recommended)
- doPrints: Should messages like `[WEBHOOK_LISTENER] Got push from master` be logged in console 

Default is:
```
var CONFIG = {
	commands: {
		"master": "./buildMaster.sh",
		"test-release": "./buildRelease.sh"
	},
	locations: {
	},
	defaultLocation: "../",
	secret: "",
	doPrints: true
}
```
Triggers on branches `master` and `test-release` running `buildMaster.sh` and `buildTestRelease.sh` respectively in parent directory.

### Deployment
Simply run `npm install` then `npm start`
If you'd like to make this server auto-start (Linux):
1. Install [nodemon](https://www.npmjs.com/package/nodemon) globally
`npm install -g nodemon`
2. Make `run.sh` executable
`chmod u+x ./run.sh`
3. Open `rc.local`, you'll need to be an administator
`sudo nano /etc/init.d/rc.local`
4. Add this launch code to the end of the file (on a new line), be sure to replace anything in `<brackets>` with the correct data
`su - <username> -c 'screen -d -m -S GPH <path_to_repo>/run.sh'`
5. Run `run.sh` to start
`./run.sh`

### Webhook setup
1. GitHub repository settings
2. Webhooks
3. Add webhook
4. Set `Payload URL`, this server runs on the environment variable `PORT` or 3000 by default. Listening on `http://your.url:3000/`
5. Set `Content type` to `application/json`
6. Set `Secret` to the same secret you defined in `CONFIG` or the environment variable `GITHUB_WEBHOOK_SECRET`
7. Don't change anything else, press `Add webhook`
After this final step, if you've deployed already and `doPrints` is true, the console should print `Got ping from GitHub:` along with a zen message from GitHub