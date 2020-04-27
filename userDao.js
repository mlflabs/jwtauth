const bcrypt = require('bcrypt');

const userDao = {};
const app = require('./index');
const shortid = require('shortid');


userDao.validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

userDao.encryptPassword = async (password) => {
  return await bcrypt.hash(password, 10);
}

userDao.saveUserBasic = async (username, email, password, userdb) => {
  const hashPass =  await bcrypt.hash(password, 10);
  let id = '';
  let unique = false;
  let tries = 0
  while(!unique) {
    const length = 4 + Math.floor(tries/5)
    id = shortid.generate().substring(0,length);
    unique = userDao.uniqueId(id, userdb);
    //can't have ids starting with underscore
    if(id.substring(0,1) == '_') unique = false;
    if(id.substring(0,1) == '-') unique = false;
    tries++;
  }


  const user = {
    _id: id.toString(),
    username: username.toString(),
    email: email,
    loginCode: Date.now(),
    role: 'user',
    //$FlowFixMe
    [process.env.ACCESS_META_KEY]: {},
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

userDao.addRightsToUser = async (id, channel, rights, userdb) => {
  try{

    const userdoc = await userDao.getUser(id, userdb);
    //console.log(userdoc);

    userdoc[process.env.ACCESS_META_KEY][channel] = rights;
    const res = await userdb.insert(userdoc);
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
  2.  (Channel item) 0 - can't see, 1 - can see, 2 - can edit
  3.  (Channel children) 0 - can't see, 1 - can see own, 2 - can see all items
  4.  (Channel children edit) 0 -can't edit, 1 can edit/make own, 2 can edit all 
  examples
  1000 - admin, can do everything
  0121 - can be in channel, see everything edit its own
  0122 - can be in porject, see everything and edit everthing within channel
*/
userDao.addChannel = async (id, channelName, userdb, rights = '0122') => {
  try {
    const user = await userDao.getUser(id, userdb);
    if(!user)
      return false;

    if(!user[process.env.ACCESS_META_KEY]) user[process.env.ACCESS_META_KEY] = {};

    user[process.env.ACCESS_META_KEY][channelName] = rights;

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

userDao.getUserByUsernameOrEmail = async (id, userdb) => {
  const isemail = userDao.validateEmail(id);
  if(isemail)
    return await userDao.getUserByEmail(id, userdb);
  else
    return await userDao.getUserByUsername(id, userdb);
}

userDao.getUserByUsername = async (username, userdb) => {
  try{
    const q = {
      selector: {
        username: {'$eq': username}
      },
      limit: 1
      //use_index: ''
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
        msg: 'Error Username not found'
      }]};

  }
  else if(email){
    console.log('login in using email: ', email);
    user = await userDao.getUserByEmail(email, userdb);
    if(!user)
      return { success: false, errors: [{
        location: 'database',
        msg: 'Error email or password not valid'
      }]};
  }

  console.log('User ', user);
  
  const valid = await bcrypt.compare(password, 
    //$FlowFixMe - its part of the user document.
    user.strategies.basic.password);
  console.log('Valid: ', valid);
  if(!valid)
    return { success: false, errors: [{
      location: 'database',
      msg: 'Error password not valid'
    }]};

  return { success: true, errors: [], user: user};
  
}





module.exports = userDao; 


