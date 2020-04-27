const express = require('express');
const jwt = require('jsonwebtoken');
const { check, body, oneOf, validationResult } = require('express-validator');
const userDao = require('../userDao');
const utils = require('../utils');

const router = express.Router();

//$FlowFixMe
router.use((req, res, next) => {

  next();
})

//$FlowFixMe
router.get('/', (req, res) =>{
  res.send('Auth System');
}); 



function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}


function createNewToken(user, app){
  //$FlowFixMe
  const exp = Date.now() + (process.env.TOKEN_REFRESH_LENGTH_DAYS * 86400000);
  //$FlowFixMe
  const refreshexp = Date.now() + (process.env.TOKEN_LENGTH_DAYS * 86400000 );
  //channels[process.env.CHANNEL_USER_PREFIX + app + user._id]
  return  {
    exp: exp,
    token: jwt.sign({ 
      id : user._id,
      username: user.username,
      app: app,
      role: user.role,
      code: user.loginCode,
      refresh: refreshexp,
      ch: user[process.env.ACCESS_META_KEY]},
      process.env.TOKEN_SECRET,
      //$FlowFixMe
      { expiresIn: process.env.TOKEN_REFRESH_LENGTH_DAYS+'d'})};
}

// *** Login
//$FlowFixMe
router.post('/login', [
  oneOf([
    body('id').trim().isLength({ min: 3 }).trim().escape(),
  ], 'Valid username or password requried'),
  body('app', 'Valid app id is required').isLength({ min: 2 }).trim().escape(),
  body('password', 'Valid password is required').trim().isLength({ min: 3 }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return utils.sendErrorFromExpressValidaiton(errors, res);
  }

  //console.log('Login Res body: ', req.body);
  let password = req.body.password;
  let username;
  let email;
  let app = req.body.app;
  const id = req.body.id;

  if(id){
    //we have id, see if its username or email
    if(validateEmail(id)){
      email = id;
    }
    else {
      username = id;
    }
  }

  const auth = await userDao.authenticateLocal(username, email, password, 
    req.app.userdb);

  //console.log('Login Authentication: ', auth);
  if(!auth.success)
    return utils.sendErrorFromExpressValidaiton(auth.errors, res);

  const {exp, token} = createNewToken(auth.user, app);

  return res.json({ success: true,
                    token: token,
                    app: app,
                    expires: exp, 
                    //$FlowFixMe
                    [process.env.ACCESS_META_KEY]: auth[process.env.ACCESS_META_KEY], 
                    username: auth.user.username,
                    id: auth.user._id,
                    email: auth.user.email });
   
});




// **** REFRESH
//$FlowFixMe
router.post('/renewToken', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);
  }
  //console.log('Login Res body: ', req.body);
  const token = req.body.token;
  
  try{
    const payload = jwt.verify(token, process.env.TOKEN_SECRET )
    //$FlowFixMe - if payload is undefined, jwt.verify will throw an error
    const userdoc = await userDao.getUser(payload.id, req.app.userdb);
    if(!userdoc) throw new Error('Token contains incorect user id');

    //$FlowFixMe  - code is part of our key, its used to check if token is still valid or user loged out
    if(payload.code !== userdoc.loginCode){
      return utils.sendError('token', 'Token code is not valid, please relogin.', res);
    }
    const tokenres = createNewToken(userdoc, payload.app);
    //const tokendata = utils.getTokenPayload(tokenres.token);
    return res.json({ token: tokenres.token,
                      ch: userdoc[process.env.ACCESS_META_KEY],
                      app: payload.app,
                      expires: tokenres.exp, 
                      username: userdoc.username, // TODO: remove in future
                      id: userdoc._id,
                      email: userdoc.email });

  }
  catch(e){
    console.log('Token Verify Error:::: ', e.message, e.name)

    //if its expiery error, lets tell the user
    if(e.name === 'TokenExpiredError'){
      
    }
    return res.status(422).json({ errors: [{
      location: 'token',
      msg: 'Invalid token, or token has expired. Please relogin'
    }]});
  }
});




// *** Forgot Password
//$FlowFixMe
router.post('/forgotpassword', [
  body('id', 'Username or email required as id').trim().isLength({ min: 3 }).trim().escape(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const id = req.body.id;
  let userDoc;

  if(id){
    //we have id, see if its username or email
    if(validateEmail(id)){
      userDoc = await userDao.getUserByEmail(id, req.app.userdb);
    }
    else {
      userDoc = await userDao.getUserByUsername(id, req.app.userdb);
    }
  }
  if(userDoc == null){
    //if we have user, lets email them a link to change it
    return res.json({ 
      message : 'Username or Email not found',
      success : false 
    });
  }

  return res.json({ 
    message : 'Email has been sent.',
    success : true 
  });

  
});





// *** register
//$FlowFixMe
router.post('/register', [
  body('password', 'Password needs to be at leaset 5 characters long').trim().isLength({ min: 3 }).bail(),
  body('username', 'Username must be at lease 3 characters').trim().isLength({ min: 3 }).trim().escape().bail(),
  body('username', 'Username must not be more than 20 characters').trim().isLength({ max: 20 }).trim().escape().bail(),
  body('email', 'Valid email is required').isEmail().normalizeEmail().bail(),
  body('username', 'Username is already in use')
    .custom( async (value, {req}) => {
      const res =  await userDao.uniqueUsername(value, req.app.userdb);
      if(!res)
        throw new Error('Username already taken');
  }).bail(),
  body('email', 'Email is already in use')
    .custom( async (value, {req}) => {
      const res = await userDao.uniqueEmail(value, req.app.userdb);
      if(!res)
        throw new Error('Email already taken');
  }).bail()
], async (req, res) => {
  try {
    
    const errors = validationResult(req);

    console.log(errors.array());

    if (!errors.isEmpty()) {
      return utils.sendErrorFromExpressValidaiton(errors.array(), res);
    }

    //save user
    //console.log('body', req.body);
    const daores = await userDao.saveUserBasic( req.body.username, 
                                                req.body.email, 
                                                req.body.password,
                                                req.app.userdb);
    //console.log('DaoRes:', daores);
    if(daores){
      return utils.sendRes(res, 'Singup successful');
    }
    else {
      return utils.sendError('database', 
        'Error saving to database, please wait a few min land try again.', res);
    }
  }
  catch(e){
    console.log(e);

  }
  
  
});



// *** LOGOUT
//$FlowFixMe
router.post('/logout', [
  body('token', 'Valid token is required to logout').trim().isLength({ min: 3 }),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.userDoc = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);
  }

  try{
    await userDao.saveUser({...req.userDoc, ...{loginCode: Date.now()}}, req.app.userdb);
    //lets save user with new user code, this will prevent future refresh
    return res.json({status: true, action: 'logout'});

  }
  catch(e){
    console.log('Logout Error:::: ', e.message)
    return utils.sendError('database', 'Error removing token, please try again', res);
  }

});


module.exports = router;

