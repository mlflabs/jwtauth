const express = require('express');
const utils = require('../utils');
const { check, body, oneOf, validationResult } = require('express-validator');
const channelDao = require('../channelDao');
const messagesDao = require('../messagesDao');
const userDao = require('../userDao');
const router = express.Router();


router.get('/', (req, res) =>{
  res.send('Auth System');
}); 


// *** Add channel to user
router.post('/newchannel', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('name', 'Channel Name is required').trim().isLength({min:3}).bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
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
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    const payload = utils.getTokenPayload(req.body.token);

    //create new channel, with user as creator
    const resChannel = await channelDao.saveChannel(
      req.userDoc, payload.app, req.body.name,  req.app.channeldb,req.app.userdb)

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


router.post('/addmember', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('channel','Channel required').trim().isLength({ min: 3 }).trim().escape().bail(), 
  body('id', 'Id of friend is required').trim().isLength({ min: 3 }).trim().escape().bail(),
  body('rights', 'Incorect rights length, need a 4 digit number').trim().isLength({ min: 4, max: 4 }).trim().escape().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
      if(res.ok) {
        req.userDoc = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }),
  body('id', 'Member ID is incorect, cannot find user').bail()
    .custom( async (value, {req}) => {
      
      const friend = await userDao.getUser(value, req.app.userdb);

      if(!friend){
        throw new Error('Friend Id is invalid');
      }
      req.friendDoc = friend;
      console.log(friend);
      return true;
  }),
  body('channel', 'Channel name not valid')
    .custom( async (value, {req}) => {
      const res = await  channelDao.getChannel(value, req.app.channeldb);
      if(res) {
        req.channelDoc = res;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }),
  
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);
   

  const channel = req.body.channel;
  const rights = req.body.rights;


  try{
    const userdoc = req.userDoc;

    //check if user has admin access to this channel

    const userrights = userdoc.meta_access.channels[channel];

    if(!utils.canEditProject(userrights)){
      return utils.sendError('rights', 'Insufficient rights, can not add user to this party');
    }

    //see if we are giving away admin rights
    //non admin user can't give admin rights
    if(!utils.isAdmin(userrights) && utils.isAdmin(rights)){
      return utils.sendError('rights', 'Insufficient rights, can not add admin user to this party');
    }

    const friend = req.friendDoc;

    //see if this is duplicate request
    const duplicate = await channelDao.checkIfRequestAlreadySent(
        userdoc._id, friend._id, channel, req.app.channeldb);
    
    if(duplicate)
      return utils.sendError('duplicate', 'Request for this memeber has alread been sent.', res);

    const date = Date.now();
    resRequest = await channelDao.saveAddMemberRequest(friend._id,
      { type: 'addmember', 
        host: userdoc._id,
        date, 
        channel: channel, 
        right: rights }, req.app.channeldb);
    
    msgRes = await messagesDao.sendMessage(friend._id, 
                messagesDao.getMsg(friend.username, userdoc.username,'party', 
                '', {channel: channel, name: req.channelDoc.name, date, type:'invite'}), req.app.apidb);

    msgRes = await messagesDao.sendMessage(userdoc._id, 
                messagesDao.getMsg(userdoc.username, 'system','party/'+channel, 
                '', {channel: channel, name: req.channelDoc.name, date, type: 'sendinvite'}), req.app.apidb);

    if(!resRequest || !msgRes){
      return res.status(422).json({ errors: [{
          location: 'Database',
          code: 362,
          msg: 'Error adding share request.  Please try again at a later time.'
      }]});
    }


    return res.json({  message : 'Request added.',
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

