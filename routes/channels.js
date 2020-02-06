const express = require('express');
const utils = require('../utils');
const { check, body, oneOf, validationResult } = require('express-validator/check');
const channelDao = require('../channelDao');
const router = express.Router();


router.get('/', (req, res) =>{
  res.send('Auth System');
}); 


// *** Add channel to user
router.post('/newchannel', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('token', 'Token is not valid').bail()
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
      if(res.ok) req.userDoc = res.data;
      return res.ok;
  })
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    const payload = utils.getTokenPayload(req.body.token);

    //create new channel, with user as creator
    const resChannel = await channelDao.saveChannel(
      req.userDoc, payload.app, req.app.channeldb,req.app.userdb)

    if(!resChannel){
      return utils.sendErrorFromResult(resChannel, res);
    }
    return utils.sendRes(res, 'Channel saved', {channel: resChannel.data});
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('database', 'Error saving, please wait and try again later.', res);
  }
});


router.post('/sharechannel', [
  body('token', 'No token given').trim().isLength({ min: 3 }),
  body('channel','Channel required').trim().isLength({ min: 3 }).trim().escape(), 
  body('id', 'Id of friend is required').trim().isLength({ min: 3 }).trim().escape(),
  body('r', 'Read access selection is required').trim().isLength({ min: 1 }).trim().escape(),
  body('w', 'Write access selection is required.').trim().isLength({ min: 1 }).trim().escape(),
  body('a', 'Admin access selection is required').trim().isLength({ min: 1 }).trim().escape(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const channel = req.body.channel;
  const token = req.body.token;
  const id = req.body.id;
  const r = req.body.r;
  const w = req.body.w;
  const a = req.body.a;

  try{
    const payload = jwt.verify(token, process.env.TOKEN_SECRET )
    console.log('PAYLOAD:: ',payload);


    //Need to double check if auto refresh is ok for this user, or user has logout 
    const userdoc = await userDao.getUser(payload.id, req.app.userdb);
    console.log('UserDOC: ', payload.id, userdoc);

    //check if we still have same token code
    if(payload.code !== userdoc.loginCode){
      return res.status(422).json({ errors: [{
        location: 'token',
        msg: 'Token code is not valid, please relogin.'
      }]});
    }


    //check if user has admin access to this channel
    const rights = userdoc.meta_access.channels[channel];
    if(!rights.a){
      return res.status(422).json({ errors: [{
        location: 'access',
        msg: 'You do not have rights to share this channel'
      }]});
    }

    //check if the id is a valid pointer, 
    var friend;
    if(validateEmail(id)){
      friend = userDao.getUserByEmail(id, req.app.userdb);
    }
    else {
      friend = userDao.getUserByUsername(id, req.app.userdb);
    }

    if(!friend){
      //TODO: Here we can send email to user and request them to register
      return res.status(422).json({ errors: [{
        location: 'Friend does not exist',
        code: 351,
        msg: 'Specified user does not exist, please help him/her reqister first before sharing this channel'
      }]});
    }
    console.log('Loaded Friend: ');
    console.log(friend);

    //make a request to share, channel will be added once the friend accepts it
    const rights2 = {r: (r == true), w: (w == true), a: (a == true)}
    resRequest = userDao.saveUserRequest(friend._id,
      { type: 'sharechannel', 
        host: userdoc._id,
        date: Date.now(), 
        channel: channel, 
        right: rights2 })


    if(!resRequest){
      return res.status(422).json({ errors: [{
          location: 'Database',
          code: 362,
          msg: 'Error adding share request.  Please try again at a later time.'
      }]});
    }


    return res.json({  message : 'Request saved.',
                       success : true  });

  }
  catch(e){
    console.log('Sharing request error: ', e.message, e.name)

    return res.status(422).json({ errors: [{
      location: 'database',
      msg: 'Error saving, please wait and try again later.'
    }, e]});
  }
});






module.exports = router;

