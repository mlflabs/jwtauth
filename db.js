const userDao = require('./userDao');
const channelDao = require('./channelDao');
const messagesDao = require('./messagesDao');
const socialDao = require('./socialDao');
const nano =  require('nano')(process.env.COUCHDB);

const db = {};

db.nano = nano;
db.userdb = db.nano.db.use(process.env.USER_DB);
db.channeldb = db.nano.db.use(process.env.CHANNEL_DB);
db.apidb = db.nano.db.use(process.env.API_DB);
db.socialdb = db.nano.db.use(process.env.SOCIAL_DB);

db.userDao = userDao;
db.channelDao = channelDao;
db.messagesDao = messagesDao;
db.socialDao = socialDao;


module.exports = db;