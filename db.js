const userDao = require('./userDao');
const channelDao = require('./channelDao');
const messagesDao = require('./messagesDao');
const socialDao = require('./socialDao');

class DB {
  constructor() {
    
    this.nano = require('nano')(process.env.COUCHDB);
    this.userdb = this.nano.db.use(process.env.USER_DB);
    this.channeldb = this.nano.db.use(process.env.CHANNEL_DB);
    this.apidb = this.nano.db.use(process.env.API_DB);
    this.socialdb = this.nano.db.use(process.env.SOCIAL_DB);

    this.userDao = userDao;
    this.channelDao = channelDao;
    this.messagesDao = messagesDao;
    this.socialDao = socialDao;
  }
}

const db = new DB();
module.exports = db;