const express = require('express');
const jwt = require('jsonwebtoken');
const { check, body, oneOf, validationResult } = require('express-validator/check');
const userDao = require('../userDao');
const utils = require('../utils');

const router = express.Router();


router.get('/', (req, res) =>{
  res.send('Auth System');
}); 



function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}


function createNewToken(user, app){
  const exp = Math.floor(Date.now() / 1000) + process.env.TOKEN_LENGTH_DAYS;
  if(!user.meta_access) user.meta_access = {};
  if(!user.meta_access.channels) user.meta_access.channels = [];
  const channels = user.meta_access.channels || '';
  return  {
    exp: exp,
    token: jwt.sign({ 
      id : user._id,
      username: user.username,
      app: app,
      role: user.role,
      code: user.loginCode,
      shortExp: exp,
      ch: channels,
      email: user.email },
      process.env.TOKEN_SECRET,{ expiresIn: process.env.TOKEN_LENGTH})};
}

// *** Login
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

  console.log('Auth login', auth);

  //console.log('Login Authentication: ', auth);
  if(!auth.success)
    return utils.sendErrorFromExpressValidaiton(auth.errors, res);

  const {exp, token} = createNewToken(auth.user, app);


  console.log('Token: ', token)

  return res.json({ success: true,
                    token: token,
                    app: app,
                    expires: exp, 
                    username: auth.user.username,
                    id: auth.user._id,
                    email: auth.user.email });
   
});




// **** REFRESH
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
    const userdoc = await userDao.getUser(payload.id, req.app.userdb);
    console.log('UserDOC: ', payload, userdoc);


    if(payload.code !== userdoc.loginCode){
      return utils.sendError('token', 'Token code is not valid, please relogin.', res);
    }

    const tokenres = createNewToken(userdoc, payload.app);
    
    return res.json({ token: tokenres.token,
                      channels: userdoc.meta_access.channels,
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
      msg: 'Invalid token, or token has expired. Please relogin.'
    }]});
  }



  return res.json({ token });
   
});




// *** Forgot Password
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
  console.log('Forgot password loaded user::: ', userDoc);
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
router.post('/register', [
  body('password', 'Password needs to be at leaset 5 characters long').trim().isLength({ min: 3 }),
  body('username', 'Username must be at lease 3 characters').trim().isLength({ min: 3 }).trim().escape(),
  body('username', 'Username must not be more than 20 characters').trim().isLength({ max: 20 }).trim().escape(),
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('username', 'Username is already in use')
    .custom( async (value, {req}) => {
      return await userDao.uniqueUsername(value, req.app.userdb);
  }),
  body('email', 'Email is already in use')
    .custom( async (value, {req}) => {
      return await userDao.uniqueEmail(value, req.app.userdb);
  })
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
router.post('/logout', [
  body('token', 'Valid token is required to logout').trim().isLength({ min: 3 }),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
      if(res.ok) req.userDoc = res.data;
      return res.ok;
  })
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
    return utils.sendError('database', 'Error removing token, please try again.', res);
  }

});


module.exports = router;

