const bcrypt = require('bcrypt');

const userDao = {};
const app = require('./index');
const shortid = require('shortid');

userDao.encryptPassword = async (password) => {
  return await bcrypt.hash(password, 10);
}

userDao.saveUserBasic = async (username, email, password, userdb) => {

  const hashPass =  await bcrypt.hash(password, 10);
  let id;
  unique = false;
  let tries = 0
  while(!unique) {
    const length = 4 + Math.floor(tries/5)
    id = shortid.generate().substring(0,length);
    unique = userDao.uniqueId(id, userdb);
    tries++;
  }


  const user = {
    _id: id.toString(),
    username: username.toString(),
    email: email,
    loginCode: Date.now(),
    role: 'user',
    strategies: {
      basic: {
        password: hashPass
      }
    }
  };

  const userres = await userDao.saveUser(user, userdb);

  return userres.ok;
}

userDao.saveUser = async (user, userdb) => {
  try{
    console.log('Save user: ', user);
    const res = await userdb.insert(user);
    if(res.ok == true)
      return res;
    return false;
  
  }
  catch(e){
    console.log('Save User Error: ', e);
    return false;
  } 
}

/*
  Rights, each digit represents different right
  1.  0 - Not admin 1- Admin, can change everything
  2.  (Project item) 0 - can't see, 1 - can see, 2 - can edit
  3.  (Project children) 0 - can't see, 1 - can see own, 2 - can see all items
  4.  (Project children edit) 0 -can't edit, 1 can edit/make own, 2 can edit all 
  examples
  1000 - admin, can do everything
  0121 - can be in project, see everything edit its own
  0122 - can be in porject, see everything and edit everthing within project
*/
userDao.addChannel = async (id, channelName, userdb, rights = '0122') => {
  try {
    const user = await userDao.getUser(id, userdb);
    if(!user)
      return false;

    if(!user.meta_access) user.meta_access = {};
    if(!user.meta_access.channels) user.meta_access.channels = {};

    user.meta_access.channels[channelName] = rights;

    const res = await userDao.saveUser(user, userdb);

    if(res.ok == true)
      return res;
    return false;

  }
  catch(e){
    console.log(e);
    return false;
  }
}

userDao.getUser = async (id, userdb) =>{
  try{
    
    const user = await userdb.get(id);
    console.log(id, user);
    return user;
  }
  catch(e) {
    console.log('GetUser Error: ', e.message);
    return null;
  }
}

userDao.getUserByUsername = async (username, userdb) => {
  try{
    const q = {
      selector: {
        username: {'$eq': username}
      },
      limit: 1
    }

    const res = await userdb.find(q);
    //console.log('GetUserByEmail: ',res.docs[0], res);
    if(res.docs.length > 0)
      return res.docs[0];

    return null;
  }
  catch(e) {
    console.log('GetUserByEmail Error', e);
    return null;
  }
}

userDao.getUserByEmail = async (email, userdb) => {
  try{
    const q = {
      selector: {
        email: {'$eq': email}
      },
      limit: 1
    }

    const res = await userdb.find(q);
    //console.log('GetUserByEmail: ',res.docs[0], res);
    if(res.docs.length > 0)
      return res.docs[0];

    return null;
  }
  catch(e) {
    console.log('GetUserByEmail Error', e.message);
    return null;
  }
}


userDao.uniqueUsername = async (username, userdb) => {
  return ((await userDao.getUserByUsername(username, userdb)) == null);
}

userDao.uniqueId = async (id, userdb) => {
  return ((await userDao.getUser(id, userdb)) == null);
}

userDao.uniqueEmail = async (email, userdb) => {
  return ((await userDao.getUserByEmail(email, userdb)) == null);
}



userDao.saveUserRequest = async (user, data, userdb) => {
  try{

    const unique = shortid.generate();

    const doc = {
     ... { _id: 'request|' + user + '|' + unique },
     ... data
    }

    const res = await userdb.insert(doc)

    if(res.ok == true)
      return true;
    return false;
  
  }
  catch(e){
    console.log('Save Channel Error: ', e);
    return false;
  } 
}



userDao.authenticateLocal = async (username, email, password, userdb) => {
  //console.log('Authenticating: ', username, email, password);
  let user;
  if(username){
    console.log('logging in using username', username);
    // see if username exists
    user = await userDao.getUserByUsername(username, userdb);
    if(!user)
      return { success: false, errors: [{
        location: 'database',
        msg: 'Error Username not found.'
      }]};

  }
  else if(email){
    console.log('login in using email: ', email);
    user = await userDao.getUserByEmail(email, userdb);
    if(!user)
      return { success: false, errors: [{
        location: 'database',
        msg: 'Error email or password not valid.'
      }]};
  }

  console.log('User ', user);
  const valid = await bcrypt.compare(password, 
    user.strategies.basic.password);
  console.log('Valid: ', valid);
  if(!valid)
    return { success: false, errors: [{
      location: 'database',
      msg: 'Error: password not valid.'
    }]};

  return { success: true, errors: [], user: user};
  
}





module.exports = userDao; 


