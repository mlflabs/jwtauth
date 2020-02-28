const userDao = require('./userDao');
const channelDao = require('./channelDao');
const messagesDao = require('./messagesDao');
const socialDao = require('./socialDao');

class DB {
    nano = require('nano')(process.env.COUCHDB);
    userdb = this.nano.db.use(process.env.USER_DB);
    channeldb = this.nano.db.use(process.env.CHANNEL_DB);
    apidb = this.nano.db.use(process.env.API_DB);
    socialdb = this.nano.db.use(process.env.SOCIAL_DB);

    userDao = userDao;
    channelDao = channelDao;
    messagesDao = messagesDao;
    socialDao = socialDao;

}

const db = new DB();
module.exports = db;