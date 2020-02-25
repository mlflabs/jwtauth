const express = require('express');
const utils = require('../utils');
const db = require('../db');
const { check, body, oneOf, validationResult } = require('express-validator');
const channelDao = require('../channelDao');
const messagesDao = require('../messagesDao');
const userDao = require('../userDao');
const socialDao = require('../socialDao');
const projectDao = require('../projectDao');
const router = express.Router();


router.get('/', (req, res) =>{
  res.send('MLF Social');
}); 


router.post('/acceptFriendInvitation', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('msgId','Message id required').trim().isLength({ min: 3 }).trim().escape().bail(), 
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
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
    if(messageDoc.messageType !== 'friendinvite')
      return utils.sendError('Message', "Message format not correct");

    const senderDoc = await userDao.getUserByUsername(messageDoc.from, req.app.userdb);

    if(!senderDoc){
      return utils.sendError('Message', "Request Inviter id is not valid");
    }

    const requestDoc = await channelDao.getAddMemberRequest(
      user.id, senderDoc._id, 'friendrequest', req.app.channeldb)

    if(!requestDoc){
        return utils.sendError('Message', "Message format not correct");
    }

    requestDoc['replied'] = true;
    channelDao.saveAddMemberRequest(requestDoc, req.app.channeldb);

    //add member to project doc
    await db.socialDao.addFriend(user.id, requestDoc.host);

    await messagesDao.sendMessageToUser(user.id, user.app,
        messagesDao.getMsgObject('system','event', '',
        messageDoc.from + ' friend request accepted. ', {}), req.app.apidb);

    // let sender know, user accepted invitation
    await messagesDao.sendMessageToUser(requestDoc.host, 
                messagesDao.getMsgObject('system','event', '',
                user.username + ' has accepted your friend request', 
                {}), req.app.apidb);

    return res.json({  message : 'Invitation accepted',
                       success : true  });

  }
  catch(e){
    console.log('Invitation acceptance request error: ', e.message, e.name)

    return res.status(422).json({ errors: [{
      location: 'database',
      msg: e.message,
    }, e]});
  }
});



router.post('/sendAddFriendRequest', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('username', 'Username of friend is required').trim().isLength({ min: 3 }).trim().escape().bail(),
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
  body('username', '')
    .custom( async (value, {req}) => {
      
      const friend = await userDao.getUserByUsername(value, req.app.userdb);

      if(!friend){
        throw new Error('Friend Username is not valid');
      }
      req.friendDoc = friend;
      console.log(friend);
      return true;
  }).bail(),
  
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);

  try{
    const user = req.user;
    const friend = req.friendDoc;
    const channel = 'friendrequest';

    //see if this is duplicate request
    const duplicate = await channelDao.checkIfRequestAlreadySent(
        user.id, friend._id, channel, req.app.channeldb);
    
    if(duplicate)
      return utils.sendError('duplicate', 'Request for this friend has alread been sent.', res);

    const date = Date.now();
    resRequest = await channelDao.saveAddNewMemberRequest(friend._id,
      { type: 'addfriend', 
        host: user.id,
        date, 
        channel: channel }, req.app.channeldb);
    
    msgRes = await messagesDao.sendMessageToUser(friend._id, user.app,
                messagesDao.getMsgObject(user.username, 'friendinvite', '',
                '',{}), req.app.apidb);

    msgRes = await messagesDao.sendMessageToUser(user.id, user.app,
                messagesDao.getMsgObject('system','event', '', 
                'Invite has been send to '+friend.username, {}), req.app.apidb);

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