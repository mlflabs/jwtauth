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

const formatDate = (date) => {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;
  return [year, month, day].join('');
}

const isChallengeDocId = (id) => {
  if(!utils.isSystemDoc(id)){
    throw new Error('Challenge Doc id is not valid');
  }
  if(id.split('.')[1] !== 'party' || id.split('.')[2] !== 'challenge')
    throw new Error('Challenge Doc properties are not valid');
  return;
}

const properToken = async (token, req) => {
  const res = await utils.checkProperToken(token, req.app.userdb);
      if(res.ok) {
        req.user = res.data;
        return true;
      }
      else
        throw new Error('Token is not valid');
}

const canEditChallenge = async (id, req) => {
  isChallengeDocId(id);
  const res = await channelDao.getSysDoc(id, req.app.apidb);
  if(!res) throw new Error('Doc id is not valid');

  const rights = utils.getUserRightsChannelForDoc(req.user, res.channel)
  if(!rights) 
    throw new Error('You do not have rights to this channel');

  if(!utils.canEditChannel(rights))
    throw new Error('Insufficient rights');
       
  req.challengeDoc = res;     
}

const canEditChallengeMember = async (id, req) => {
  isChallengeDocId(id);
  const res = await channelDao.getSysDoc(id, req.app.apidb);
  if(!res) throw new Error('Doc id is not valid');

  const rights = utils.getUserRightsChannelForDoc(req.user, res.channel)
  if(!rights) 
    throw new Error('You do not have rights to this channel');

  const member = res.members.find(m => m.id === req.user.id)

  const today = formatDate(Date.now());
  const submittedToday = member.progress.find(p => p.date === today);
  if(submittedToday) throw new Error('Action alredy taken today');
  
  req.member = member;
  req.challengeDoc = res;     
}


router.post('/acceptChallenge', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('challengeid', 'Proper challenge id required').notEmpty().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      await properToken(value, req);
  }).bail(),
  body('challengeid', '')
    .custom( async (value, {req}) => {
      isChallengeDocId(value);
      const res = await channelDao.getSysDoc(value, req.app.apidb);
      if(res) {
        if(res.state !== 'waiting')
          throw new Error('Challenge is not accepting invitations');
        if(!utils.getUserRightsChannelForDoc(req.user, res.channel)){
          throw new Error('Insufficient rights to join');
        }
        if(res.members.find(m => m.id === req.user.id))
          throw new Error('Already joined this challenge');
        
        
        req.challengeDoc = res;
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
    let doc = req.challengeDoc;
    const user = req.user;

    //add user
    if(!doc.members) doc.members = [];
    doc.members.push({username: user.username, id: user.id, progress: [], score: 0, joinDate: Date.now()})
    await channelDao.saveDefault(doc, req.app.apidb);

    return utils.sendRes(res, 'Challenge Accepted');
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('system', e.message, res);
  }
});



router.post('/changeChallengeState', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('challengeid', 'Proper challenge id required').notEmpty().bail(),
  body('state', 'State is required.').notEmpty().bail(),
  body('state', 'Proper state required').custom((value, {req}) => {
    if(value === 'finished' ||
       value === 'current' ||
       value === 'future' ||
       value === 'waiting' ||
       value === 'resting') return true;
    throw new Error('Proper state required.')
  }).bail(),
  body('token', 'Token is not valid')
  .custom( async (value, {req}) => {
    await properToken(value, req);
}).bail(),
  body('challengeid', '')
    .custom( async (value, {req}) => {
      await canEditChallenge(value, req);
  }).bail(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    let doc = req.challengeDoc;
    doc.state = req.body.state;
    const newdoc = await channelDao.saveDefault(doc, req.app.apidb);
    return utils.sendRes(res, 'Challenge Saved, please wait a few minutes for a data sync.', {doc: newdoc});
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('system', e.message, res);
  }
});



router.post('/submitChallengeProgress', [
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('challengeid', 'Proper challenge id required').notEmpty().bail(),
  body('progress', 'State is required.').notEmpty().bail(),
  body('token', 'Token is not valid')
  .custom( async (value, {req}) => {
    await properToken(value, req);
}).bail(),
  body('challengeid', '')
    .custom( async (value, {req}) => {
      await canEditChallengeMember(value, req);
  }).bail(),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try{
    let doc = req.challengeDoc;
    const member = req.member;
    const today = formatDate(Date.now());

    member.progress.push({
      date:today,
      value: req.body.progress,
      reward:''
    });

    const newdoc = await channelDao.saveDefault(doc, req.app.apidb);
    return utils.sendRes(res, 'Challenge Saved, please wait a few minutes for a data sync.', {doc: newdoc});
  }
  catch(e){
    console.log('Adding new channel request error: ', e.message, e.name)
    return utils.sendError('system', e.message, res);
  }
});



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

