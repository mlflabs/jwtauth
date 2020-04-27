const shortid = require('shortid');
const utils = require('./utils');
const messagesDao = {};

//to, from, points to username, not id
messagesDao.getMsgObject = (from, messageType, messageSubType, message, data) => {

  return {from, messageType, messageSubType, message, data}
}

const getUserMessageId = (userid, app, timestamp) => {
  //$FlowFixMe
  return  utils.getUserChannelName(userid, app) +
          process.env.DIV + 'msg' + 
          process.env.DIV + timestamp + 
          process.env.DIV + shortid.generate();   
}

messagesDao.getUserMessageId = getUserMessageId;

const getChannelMessageId = (channelid, timestamp) => {
  //$FlowFixMe
  return  channelid +
          process.env.DIV + 'msg' + 
          process.env.DIV + timestamp + 
          process.env.DIV + shortid.generate();   
}

messagesDao.sendMessageToUser = async (toId, app,  msg, messagesdb) => {
  try {
    const timestamp = Date.now();
    const doc = {...{
      _id: getUserMessageId(toId, app, timestamp),
      created: timestamp,
      updated: timestamp,
      type: process.env.DOC_TYPE_MSG,
      channel:  utils.getUserChannelName(toId, app)
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

messagesDao.sendMessageToChannel = async (channelid, msg, messagesdb) => {
  try {
    const timestamp = Date.now();
    const doc = {...{
      _id: getChannelMessageId(channelid, timestamp),
      created: timestamp,
      updated: timestamp,
      type: process.env.DOC_TYPE_MSG,
      channel:  channelid
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

messagesDao.updateMessageData = async (id, messagesdb) => {
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

