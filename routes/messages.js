const express = require('express');
const utils = require('../utils');
const { check, body, oneOf, validationResult } = require('express-validator');
const channelDao = require('../channelDao');
const messagesDao = require('../messagesDao');
const userDao = require('../userDao');
const router = express.Router();

//$FlowFixMe
router.get('/', (req, res) =>{
  res.send('Message System');
}); 

/*
router.post('/sendMessage',[
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('to', 'To, id of receiver is required').trim().isLength({ min: 3 }).trim().escape().bail(),
  body('type', 'Message type is required').trim().isLength({ min: 2, max: 20 }).trim().escape().bail(),
  body('message', 'Message is required').trim().isLength({ min: 1 }).trim().escape().bail(),
  
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
      if(res.ok) {
        req.userDoc = res.data;
        req.sendername = res.data.username;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }),
  body('to', 'To ID is incorect, cannot find user').bail()
    .custom( async (value, {req}) => {
      
      const to = await userDao.getUser(value, req.app.userdb);

      if(!to){
        throw new Error('Friend Id is invalid');
      }
      req.to = friend;
      return true;
  })
], (req, res) => {

  //who is this message from
  const sendername = req.sendername;
  const to = req.body.to;
  const type = req.body.type;
  const message = req.body.message;
  const msgres = messagesDao.sendMessage(req.to._id,
      messagesDao.getMsgObject(to,sendername,type,message), req.app.apidb);
  if(msgres) return utils.sendRes(res,'Message sent.')
  return utils.sendError('System', 'Error sending message')
});
*/


/*
router.post('/getMessages',[
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('from', 'From is not specified, use "0", to get all messages').trim().isLength({ min: 2 }).trim().escape().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
      if(res.ok) {
        req.userDoc = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
  })
], async (req, res) => {
/////************ figure this out 
  const msgs = await messagesDao.getMessages(req.userDoc.username, from);

  if(!msgs) return utils.sendError('System', 'Currently system is not availabe', res);

  return utils.sendRes(res,'Messages received', msgs);
});

*/
module.exports = router;