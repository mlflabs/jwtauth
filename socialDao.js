
const userDao = require('./userDao');
const  socialDao = {};
const nano = require('nano')(process.env.COUCHDB);
const db = require('./db');
const app = require('./index');
const messagesDao = require('./messagesDao');
const utils = require('./utils');


socialDao.getUser = async (id, db) => {
  try{
    const user = await db.get(id);
    return user;
  }
  catch(e) {
    console.log('GetUser Error: ', e.message);
    return null;
  }
}

socialDao.getUserOrCreate = async (id, db, userdb) => {
  let doc = await  socialDao.getUser(id, db);
  if(!doc) {
    //$FlowFixMe
    const userDoc = await userDao.getUser(id, userdb);
    if(!userDoc) throw new Error('User id is not valid, '+id);

    doc = {
      _id: id,
      username: userDoc.username,
      friends: [],
      progress: [],
    }
  }
  return doc;
}

socialDao.getUserById = async (id, db) => {
  let doc = await socialDao.getUser(id, db);
  if(!doc) throw new Error('User does not exist');
  return doc;
}

socialDao.saveUser = async (userDoc, db) => {
  try{
    console.log('Save user: ', userDoc);
    //$FlowFixMe
    const res = await db.insert(userDoc);
    if(res.ok == true)
      return res;
    return false;
  
  }
  catch(e){
    console.log('Save User Error: ', e);
    return false;
  } 

}


socialDao.addFriend = async (userid, friendid, db, userdb) => {
  try {
    const userDoc = await socialDao.getUserOrCreate(userid, db, userdb);
    const friendDoc = await socialDao.getUserOrCreate(friendid, db, userdb);

    userDoc.friends = userDoc.friends.filter(u => u.id !== friendDoc._id);
    friendDoc.friends = friendDoc.friends.filter(u => u.id !== userDoc._id);
    userDoc.friends.push({username: friendDoc.username, id: friendDoc._id});
    friendDoc.friends.push({username: userDoc.username, id: userDoc._id});

    await socialDao.saveUser(userDoc, db);
    await socialDao.saveUser(friendDoc, db);

    return {user: userDoc, friend: friendDoc};
    //if these are false, create new users
  }
  catch(e) {
    console.log(e);
    throw new Error('Request invalid could not process');
  }
}

const formatMessageBroadcastDoc = (msgDoc, fromid, toId, app) => {
  const timestamp = Date.now();
  return {
    id: messagesDao.getUserMessageId(toId, app, timestamp),
    message: msgDoc.message,
    messageType: msgDoc.messageType,
    messageSubType: msgDoc.messageSubType,
    data: msgDoc.data,
    type: 'msg',
    from: fromid,
    channel: utils.getUserChannelNameFromUserAndApp(toId, app),
    updated: timestamp,
    created: timestamp
  }
}


socialDao.broadcastMessage = async (msgDoc, userDoc, socialDb, appDb) => {
    console.log(msgDoc, userDoc);
    const socialUser = await socialDao.getUserById(userDoc.id, socialDb);

    if(!socialUser.friends) throw new Error('Social doc missing users');

    let newMsgs = [];
    for(let i = 0; i < socialUser.friends.length; i ++) {
      newMsgs.push(formatMessageBroadcastDoc( msgDoc, 
                                              userDoc.id,
                                              socialUser.friends[i].id,
                                              userDoc.app));
    }

    //plus add yourself
    newMsgs.push(formatMessageBroadcastDoc( msgDoc, 
                                            userDoc.id,
                                            userDoc.id,
                                            userDoc.app))

    const res = await appDb.bulk({docs: newMsgs});
    return res;
}



module.exports = socialDao;