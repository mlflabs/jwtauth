const shortid = require('shortid');
const utils = require('./utils');
const messagesDao = {};

//to, from, points to username, not id
messagesDao.getMsgObject = (to, from, messageType, message, data) => {

  return {to, from, messageType, message, data}
}

const getMessageId = (userid, app) => {
  return  utils.getUserChannelName(userid, app) +
          process.env.DIV + 'msg' + 
          process.env.DIV + Date.now() + 
          process.env.DIV + shortid.generate();   
}

messagesDao.sendMessage = async (toId, user,  msg, messagesdb) => {
  try {
    const doc = {...{
      _id: getMessageId(toId, user.app),
      created: Date.now(),
      updated: Date.now(),
      type: process.env.DOC_TYPE_MSG,
      channel:  utils.getUserChannelName(toId, user.app)
    }, ...msg}
    const res = await messagesdb.insert(utils.checkDocStructureBeforeSave(doc));
    if(res.ok) return true;
    return false;
  }
  catch(e) {
    console.log(e);
    return false;
  }
}

messagesDao.getMessageDoc = async (id, messagesdb) => {
  try{
    const msg = await messagesdb.get(id);
    return msg;
  }
  catch(e) {
    console.log('GetMsg Error: ', e.message);
    return null;
  }
}

//fromDate can be timestamp
/*
messagesDao.getMessages = async (username, timestamp, messagesdb) => {
  try {
    const res = await messagesdb.list({
      startkey: 'msg|' + username + '|' + timestamp,
      endkey: 'msg|' + username + '|z',
      include_docs: true,
    });

    return res.rows.map(row => row.doc);
  }
  catch(e) {
    console.log(e);
    return false;
  }
}
*/






module.exports = messagesDao;

