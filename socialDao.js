const db = require('./db');
const userDao = require('./userDao');
const  socialDao = {};
const nano = require('nano')(process.env.COUCHDB);
socialdb = nano.db.use(process.env.SOCIAL_DB);
userdb = nano.db.use(process.env.USER_DB);
//const _  = require('lodash');



socialDao.getUser = async (id) => {
  try{
    const user = await socialdb.get(id);
    console.log(id, user);
    return user;
  }
  catch(e) {
    console.log('GetUser Error: ', e.message);
    return null;
  }
}

socialDao.getUserOrCreate = async (id) => {
  let doc = await  socialDao.getUser(id);
  if(!doc) {
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

socialDao.saveUser = async (userDoc) => {
  try{
    console.log('Save user: ', userDoc);
    const res = await socialdb.insert(userDoc);
    if(res.ok == true)
      return res;
    return false;
  
  }
  catch(e){
    console.log('Save User Error: ', e);
    return false;
  } 

}


socialDao.addFriend = async (userid, friendid) => {
  try {
    const userDoc = await socialDao.getUserOrCreate(userid);
    const friendDoc = await socialDao.getUserOrCreate(friendid);

    userDoc.friends.filter(u => u.id !== friendDoc.id);
    friendDoc.friends.filter(u => u.id !== userDoc.id);
    userDoc.friends.push({username: friendDoc.username, id: friendDoc._id});
    friendDoc.friends.push({username: userDoc.username, id: userDoc._id});

    await socialDao.saveUser(userDoc);
    await socialDao.saveUser(friendDoc);

    return {user: userDoc, friend: friendDoc};
    //if these are false, create new users
  }
  catch(e) {
    console.log(e);
    throw new Error('Request invalid could not process');
  }
}



module.exports = socialDao;