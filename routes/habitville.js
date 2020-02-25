const express = require('express');
const utils = require('../utils');
const { check, body, oneOf, validationResult } = require('express-validator');
const channelDao = require('../channelDao');
const messagesDao = require('../messagesDao');
const userDao = require('../userDao');
const projectDao = require('../projectDao');
const router = express.Router();


router.get('/', (req, res) =>{
  res.send('Habitville System');
}); 


const clearSysDocSensetiveData = (doc) => {
  delete created;
  delete updated;
  delete _id;
  delete id;
  delete secondaryType;
  delete type;
  delete progress;
  delete members;
  delete creator;
  return doc;
}



router.post('/editProject', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('id', 'docid required').trim().isLength({ min: 3 }).bail(),
  body('doc', 'doc with modified properties required').notEmpty().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      const res = await utils.checkProperToken(value, req.app.userdb);
      if(res.ok) {
        req.user = res.data;

        //CHECK IF USER HAS THE RIGHTS TO EDIT
         
        return true;
      }
      else
        throw new Error('Token is not valid');
  }).bail(),
  body('id', '')
    .custom( async (value, {req}) => {
      const res = await channelDao.getChannel(value, req.app.apidb);
      if(res) {
        req.sysDoc = res;
        return true;
      }
      else
        throw new Error('Doc id is not valid');
  }).bail(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    let doc = clearSysDocSensetiveData(req.body.doc);



    //create new channel, with user as creator
    const resChannel = await channelDao.saveNewSystemDoc(
      req.user, req.body.channelid, req.body.doctype, doc,  req.app.apidb)

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



module.exports = router;

