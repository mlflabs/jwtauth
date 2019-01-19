const bcrypt = require('bcrypt');
const uuidv1 = require('uuid/v1');
const userDao = {};


userDao.encryptPassword = async (password) => {
  return await bcrypt.hash(password, 10);
}

userDao.saveUserBasic = async (username, email, password, userdb) => {
  
  console.log('Pass:', password);
  const hashPass =  await bcrypt.hash(password, 10);

  //const id = uuidv1();

  const user = {
    _id: username,
    // username: username,
    email: email,
    loginCode: Date.now(),
    strategies: {
      basic: {
        password: hashPass
      }
    }
  };

  return await userDao.saveUser(user, userdb)
}

userDao.saveUser = async (user, userdb) => {
  try{
    console.log('Save user: ', user);
    const res = await userdb.insert(user);
    console.log(res);
    if(res.ok == true)
      return res;
    return false;
  
  }
  catch(e){
    console.log('Save User Error: ', e);
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
  return ((await userDao.getUser(username, userdb)) == null);
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
    user = await userDao.getUser(username, userdb);
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


