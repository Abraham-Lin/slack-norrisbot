'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var NorrisBot = function Constructor(settings) {
	this.settings = settings;
	this.settings.name = this.settings.name || "NorrisBot";
	this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');

	this.user = null;
	this.db = null;
};

/* Allows NorrisBot to inherit from Bot constructor */ 
util.inherits(NorrisBot, Bot);

NorrisBot.prototype.run = function() {
	/* First instantiate the NorrisBot */
	NorrisBot.super_.call(this, this.settings);

	/* On the 'start' and 'message' events, we call the _onStart and _onMessage functions respectively */
	this.on('start', this._onStart);
	this.on('message', this._onMessage);
	console.log("The Chuck Norris bot is now ready to entertain you on your favorite Slack channel.");
};

NorrisBot.prototype._onStart = function() {
	this._loadBotUser();
	this._connectDB();
	this._firstRunCheck();
};

NorrisBot.prototype._loadBotUser = function() {
	var self = this;
	this.user = this.users.filter(function(user) {
		return user.name === self.name;
	})[0];
};

NorrisBot.prototype._connectDB = function() {
	this.db = new SQLite.Database(this.dbPath);
};

NorrisBot.prototype._firstRunCheck = function() {
	var self = this;
	self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
		if (err) {
			return console.error('DATABASE ERROR: ', err);
		}

		var currTime = (new Date()).toJSON();

		/* It is the first run */
		if (!record) {
			self._initialMessage();
			return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currTime);

		}

		/* updates users with last new running time */
		self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currTime);
	});
};

/* Initial message looked too ugly in the function, so let's just abstract that away */
NorrisBot.prototype._initialMessage = function() {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, I am here to keep you entertained.', {as_user: true});
};

NorrisBot.prototype._onMessage = function(message) {
	if (this._isChatMessage(message) && this._isChannelConversation(message) && this._isMentioning(message) && this._isFromBot(message)) {
		this._replyWithRandomJoke(message);
	}
};

NorrisBot.prototype._isChatMessage = function(message) {
	/* Is the message a message and is it non-empty */
	return message.type === 'message' && Boolean(message.text);
};

NorrisBot.prototype._isChannelConversation = function(message) {
	return (typeof message.channel === 'string' && message.channel[0] === 'C');
};

NorrisBot.prototype._isFromBot = function(message) {
	return message.user === this.user.id;
};

NorrisBot.prototype._isMentioning = function(message) {
	return message.text.toLowerCase().indexOf('chuck norris') > -1 || message.text.toLowerCase(this.name) > -1;
};

NorrisBot.prototype._replyWithRandomJoke = function(message) {
	var self = this;
	self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
		if (err) {
			return console.error('Database Error: ', err);
		}

		var channel = self._getChannelByID(message.channel);
		self.postMessageToChannel(channel.name, record.joke, {as_user: true});
		self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
	});
};

NorrisBot.prototype._getChannelByID = function(id) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

/* Exports NorrisBot Constructor so it is avaliable for other files */
module.exports = NorrisBot;
