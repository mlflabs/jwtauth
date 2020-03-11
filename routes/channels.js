const express = require('express');
const utils = require('../utils');
const { check, body, oneOf, validationResult } = require('express-validator');
const channelDao = require('../channelDao');
const messagesDao = require('../messagesDao');
const userDao = require('../userDao');
const router = express.Router();


//$FlowFixMe
router.get('/', (req, res) =>{
  res.send('Auth System');
}); 


//$FlowFixMe
router.post('/editSystemDoc', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('doc', 'doc body required').notEmpty().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.user = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }).bail(),
  body('doc', '')
    .custom( async (doc, {req}) => {
      if(!doc.id) throw new Error('Doc object needs a valid id')
      const res = await channelDao.getSysDoc(doc.id, req.app.apidb);
      if(res) {
        req.systemDoc = res;
        return true;
      }
      else
        throw new Error('Doc object does not exist');
  }).bail(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    let doc = {};
    if(req.body.doc) doc = req.body.doc;
    //delete any datatypes users should not have access to
    delete doc.id;
    delete doc.type;
    delete doc.members;
    delete doc.updated;
    delete doc.creator;
    delete doc.rev;

    const newdoc = await channelDao.saveDefault({...req.systemDoc, ...doc},  req.app.apidb)

    return utils.sendRes(res, 'System Doc saved', {doc: newdoc});
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('database', 'Error saving, please wait and try again later.', res);
  }
});



//$FlowFixMe
router.post('/addNewSystemDoc', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('channelname', 'channel name required').trim().isLength({ min: 3 }).bail(),
  body('doc', 'doc body required').notEmpty().bail(),
  body('doctype', 'Doc type is required').notEmpty().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.user = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }).bail(),
  body('channelname', '')
    .custom( async (value, {req}) => {
      const res = await channelDao.getChannel(value, req.app.apidb);
      if(res) {
        req.channelDoc = res;
        return true;
      }
      else
        throw new Error('channel name is not valid');
  }).bail(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    let doc = {};
    if(req.body.doc) doc = req.body.doc;

    let secondaryType = req.body.secondaryType || doc.secondaryType || undefined;
    //create new channel, with user as creator
    const resChannel = await channelDao.saveNewSystemDoc(
      req.user, req.body.channelname, req.body.doctype, secondaryType,  doc,  req.app.apidb)

    if(!resChannel || !resChannel.ok){
      return utils.sendErrorFromResult(resChannel, res);
    }
    return utils.sendRes(res, 'System Doc saved', {doc: resChannel.data});
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('database', 'Error saving, please wait and try again later.', res);
  }
});


//$FlowFixMe
router.post('/addNewChannel', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('name', 'Channel Name is required').trim().isLength({min:3}).bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.user = res.data;
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
    let doc = {};
    if(req.body.doc) doc = req.body.doc;
    //create new channel, with user as creator
    const resChannel = await channelDao.saveNewChannel(
      req.user, req.user.app, req.body.name, doc,  req.app.apidb ,req.app.userdb)

    if(!resChannel || !resChannel.ok){
      return utils.sendErrorFromResult(resChannel, res);
    }

    
    return utils.sendRes(res, 'Channel saved', resChannel.data);
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('database', 'Error saving, please wait and try again later.', res);
  }
});

//$FlowFixMe
router.post('/sendAddMemberRequest', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('channelid','Channel required').trim().isLength({ min: 3 }).trim().escape().bail(), 
  body('username', 'Username of friend is required').trim().isLength({ min: 3 }).trim().escape().bail(),
  body('rights', 'Incorect rights length, need a 4 digit number').trim().isLength({ min: 4, max: 4 }).trim().escape().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.user = res.data;
        return true;
      }
      else{
        throw new Error('Token is not valid');
      }
        
  }).bail(),
  body('username', '').bail()
    .custom( async (value, {req}) => {
      
      const friend = await userDao.getUserByUsername(value, req.app.userdb);

      if(!friend){
        throw new Error('Friend username is invalid');
      }
      req.friendDoc = friend;
      console.log(friend);
      return true;
  }).bail(),
  body('channelid', 'Channel name not valid')
    .custom( async (value, {req}) => {
      const res = await  channelDao.getChannel(value, req.app.apidb);
      if(res) {
        req.channelDoc = res;
        return true;
      }
      else
        throw new Error('Channel name not valid');
  }),
  
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);
   

  const channel = req.body.channelid;
  const rights = req.body.rights;


  try{
    const user = req.user;

    //check if user has admin access to this channel

    const userrights = user[process.env.ACCESS_META_KEY][channel];

    if(!utils.canEditChannel(userrights)){
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
        user.id, friend._id, channel, req.app.channeldb);
    
    if(duplicate)
      return utils.sendError('duplicate', 'Request for this memeber has alread been sent.', res);

    const date = Date.now();
    const resRequest = await channelDao.saveAddNewMemberRequest(friend._id,
      { type: 'addmember', 
        host: user.id,
        date, 
        projectid: req.body.projectid,
        channel: channel, 
        rights: rights }, req.app.channeldb);
    
    await messagesDao.sendMessageToUser(friend._id, user.app,
                messagesDao.getMsgObject(user.username, 'channelinvite', '',
                '', {channel: channel, name: req.channelDoc.name, date}), req.app.apidb);

    await messagesDao.sendMessageToUser(user.id, user.app,
                messagesDao.getMsgObject('system','event', '', 
                'Invite has been send to '+friend.username, {channel: channel, name: req.channelDoc.name, date}), req.app.apidb);

    if(!resRequest){
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


//$FlowFixMe
router.post('/acceptChannelInvitation', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('msgId','Message id required').trim().isLength({ min: 3 }).trim().escape().bail(), 
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.userDoc = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }).bail(),
  body('msgId', 'Message Id  not valid')
    .custom( async (value, {req}) => {
      const res = await  messagesDao.getMessageDoc(value, req.app.apidb);
      if(res) {
        req.messageDoc = res;
        return true;
      }
      else
        throw new Error('Message id is not valid');
  }),
  
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);
   
  try{
    const user = req.userDoc;
    const messageDoc = req.messageDoc;
    
    //make sure we have proper message
    if(messageDoc.messageType !== 'channelinvite')
      return utils.sendError('Message', "Message format not correct");

    const senderDoc = await userDao.getUserByUsername(messageDoc.from, req.app.userdb);

    if(!senderDoc){
      return utils.sendError('Message', "Request Inviter id is not valid");
    }

    const channelDoc = await channelDao.getChannel(messageDoc.data.channel, req.app.apidb);

    if(!channelDoc){
        return utils.sendError('Message', "Channel does not exist");
    }

    const requestDoc = await channelDao.getAddMemberRequest(
      user.id, senderDoc._id, messageDoc.data.channel, req.app.channeldb)

    if(!requestDoc){
        return utils.sendError('Message', "Message format not correct");
    }

    requestDoc['replied'] = true;
    channelDao.saveAddMemberRequest(requestDoc, req.app.channeldb);

    //add member to project doc
    const prores = await channelDao.addMemberToChannel(utils.getChannelDocId(requestDoc.channel), user, 
      requestDoc.rights, req.app.apidb);

    if(!prores)
      return utils.sendError('Project', "Couldn't load project, project doesn't exist");

    const userres = await userDao.addRightsToUser(user.id, 
        requestDoc.channel, requestDoc.rights, req.app.userdb);

    if(!userres){
      return utils.sendError('System', "Internal System error, please wait and try again.");
    }

    const msgRes1 = await messagesDao.sendMessageToUser(user.id, user.app,
        messagesDao.getMsgObject('system','event', '',
        'Invitation accepted to ' + channelDoc.name, {name: channelDoc.name}), req.app.apidb);

    // let sender know, user accepted invitation
    const msgRes2 = await messagesDao.sendMessageToChannel(requestDoc.channel, 
                messagesDao.getMsgObject('system','event', '',
                'Invitation accepted to ' + channelDoc.name, 
                {user: user.username, type: 'inviteaccepted'}), req.app.apidb);

    if(!msgRes1 || !msgRes2){
      return res.status(422).json({ errors: [{
          location: 'Database',
          code: 362,
          msg: 'Error adding share request.  Please try again at a later time.'
      }]});
    }


    return res.json({  message : 'Invitation accepted',
                       success : true  });

  }
  catch(e){
    console.log('Invitation acceptance request error: ', e.message, e.name)

    return res.status(422).json({ errors: [{
      location: 'database',
      msg: 'Error saving, please wait and try again later.'
    }, e]});
  }
});



module.exports = router;

