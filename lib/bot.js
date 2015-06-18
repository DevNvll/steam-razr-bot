var steam      = require('steam');
var steamtrade = require('steam-trade');
var winston    = require('winston');
var readline   = require('readline');
var fs         = require('fs');
var botCfg     = require('./config.js');

username = botCfg.username;
password = botCfg.password;

var appid = {
    TF2: 440,
    Steam: 753
};

var contextid = {
    TF2: 2,
    Steam: 6
}

var gamesAppID = [570]; //Ingame status appid. If you don't want a In-game status, just put 000000.

var inTrade = false;

var myBackpack;

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                colorize: true,
                level: 'debug'
            }),
            new (winston.transports.File)({
                level: 'info',
                timestamp: true,
                filename: 'cratedump.log',
                json: false
            })
        ]
});

var client = new steam.SteamClient();
var trade  = new steamtrade();

if(fs.existsSync('servers.json')) {
    steam.servers = JSON.parse(fs.readFileSync('servers.json'));
}

var sentryfile;
if(fs.existsSync('sentryfile.' + username + '.hash')) {
    sentryfile = fs.readFileSync('sentryfile.' + username + '.hash');
}

client.logOn({
    accountName: username,
    password: password,
    shaSentryfile: sentryfile
});

client.on('error', function(e) {
    if (e.eresult == steam.EResult.AccountLogonDenied) {
        rl.question('Steam Guard Code: ', function(code) {
            client.logOn({
                accountName: username,
                password: password,
                authCode: code
            });
        });
    } else {
        logger.error('Steam Error: ' + e.eresult);

    }
});

client.on('sentry', function(sentry) {
    logger.info('Got new sentry file hash from Steam.  Saving.');
    fs.writeFile('sentryfile.' + username + '.hash', sentry);
});

client.on('loggedOn', function() {
    logger.info('Logged on to Steam');
    client.setPersonaState(steam.EPersonaState.Offline);
    client.joinChat('103582791438621541');
    client.on('chatEnter', function(EChatRoomEnterResponse) {
      logger.info('Joined Chat: ' + EChatRoomEnterResponse);
    });
});

client.on('webSessionID', function(sessionid) {
    trade.sessionID = sessionid;
    client.webLogOn(function(cookie) {
        cookie.forEach(function(part) {
            trade.setCookie(part.trim());
        });
        logger.info('Logged into web');
        client.setPersonaState(steam.EPersonaState.Online);
    });
});

client.on('chatMsg', function(roomId, message, type, chatterId) {
  logger.info('Message: \'' + message + '\' ' + 'from: ' + roomId + ' ' + 'by: ' + chatterId);
  if(message == '.play') {
    client.sendMessage(roomId, 'I am playing!');
    client.gamesPlayed(gamesAppID);
  }
  if(message == '.stopplay') {
    client.sendMessage(roomId, 'I\'ve stopped playing.');
    client.gamesPlayed([000000]);
  }
})
