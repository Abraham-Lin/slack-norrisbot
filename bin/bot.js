'use strict';
// xoxb-17993189494-x6UvzDfuuufwcK5PqtvkjjPV = slack api key 
var NorrisBot = require('../lib/chuckbot');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var norrisbot = new NorrisBot({
    token: token,
    dbPath: dbPath,
    name: name
});

norrisbot.run();