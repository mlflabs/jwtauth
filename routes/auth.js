const express = require('express');
const jwt = require('jsonwebtoken');
//const JWTstrategy = require('passport-jwt').Strategy;
//We use this to extract the JWT sent by the user
const ExtractJWT = require('passport-jwt').ExtractJwt;
const { check, body, oneOf, validationResult } = require('express-validator/check');
const userDao = require('../userDao');


const router = express.Router();


router.get('/', (req, res) =>{
  res.send('Auth System');
}); 



function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}


function createNewToken(user){
  return  jwt.sign({ user : user._id,
    code: user.loginCode,
    shortExp: Math.floor(Date.now() / 1000) + (60 * 60), //TODO: use settings lenth
    email: user.email },
    process.env.TOKEN_SECRET,{ expiresIn: process.env.TOKEN_LENGTH});
}

// *** Login
router.post('/login', [
  oneOf([
    body('username').trim().isLength({ min: 3 }).trim().escape(),
    body('id').trim().isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
  ], 'Valid username or password requried'),
  body('password', 'Valid password is required').trim().isLength({ min: 3 }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  //console.log('Login Res body: ', req.body);
  let username = req.body.username;
  let password = req.body.password;
  let email = req.body.email;
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
    return res.status(422).json({ errors: auth.errors});

  
  const token = createNewToken(auth.user);

  //lets decode token to see the expiary date
  const payload = jwt.decode(token);
  console.log('Payload: ', payload);


  console.log('Token: ', token)

  return res.json({ token: token,
                    expires: payload.exp, 
                    username: auth.user._id,
                    user: auth.user._id,
                    email: auth.user.email });
   
});




// **** REFRESH
router.post('/renewJWT', [
  body('token', 'No token given').trim().isLength({ min: 3 }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  //console.log('Login Res body: ', req.body);
  const token = req.body.token;
  
  try{
    const payload = jwt.verify(token, process.env.TOKEN_SECRET )
    console.log('PAYLOAD:: ',payload);


    //Need to double check if auto refresh is ok for this user, or user has logout 
    const userdoc = await userDao.getUser(payload.user, req.app.userdb);
    console.log('UserDOC: ', payload.user, userdoc);

    //check if we still have same token code
    if(payload.code !== userdoc.loginCode){
      return res.status(422).json({ errors: [{
        location: 'token',
        msg: 'Token code is not valid, please relogin.'
      }]});
    }

    const newtoken = createNewToken(userdoc);
    
    //lets decode token to see the expiary date
    const newpayload = jwt.decode(newtoken);
    console.log('New Payload: ', newpayload);

    return res.json({ token: newtoken,
                      expires: newpayload.exp, 
                      username: userdoc._id, // TODO: remove in future
                      user: userdoc._id,
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
      userDoc = await userDao.getUser(id, req.app.userdb);
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
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('username', 'Username is already in use')
    .custom( async (value, {req}) => {
      return userDao.uniqueUsername(value, req.app.userdb);
  }),
  body('email', 'Email is already in use')
    .custom( async (value, {req}) => {
      return userDao.uniqueEmail(value, req.app.userdb);
  }),
], async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  //save user
  //console.log('body', req.body);
  const daores = await userDao.saveUserBasic( req.body.username, 
                                              req.body.email, 
                                              req.body.password,
                                              req.app.userdb);
  //console.log('DaoRes:', daores);
  if(daores.ok){
    res.json({ 
      message : 'Signup successful',
      success : true 
    });
  }
  else {
    return res.status(422).json({ errors: [{
      location: 'database',
      msg: 'Error saving to database, please wait a few min land try again.'
    }]});
  }
  
});



// *** LOGOUT
router.post('/logout', [
  body('token', 'Valid token is required to logout').trim().isLength({ min: 3 }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  //console.log('Login Res body: ', req.body);
  const token = req.body.token;


  try{
    const payload = jwt.verify(token, process.env.TOKEN_SECRET )
    console.log('PAYLOAD:: ', payload);


    //Need to double check if auto refresh is ok for this user, or user has logout 
    const rec = await userDao.getUser(payload.user, req.app.userdb);
    await userDao.saveUser({...rec, ...{loginCode: Date.now()}}, req.app.userdb);
    //lets save user with new user code, this will prevent future refresh
    return res.json({status: true, action: 'logout'});

  }
  catch(e){
    console.log('Logout Error:::: ', e.message)
    return res.status(422).json({ errors: [{
      location: 'token',
      msg: 'Invalid token, or token has expired. Please relogin.'
    }]});
  }

});


module.exports = router;

