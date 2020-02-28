const express = require('express');
const utils = require('../utils');
const { check, body, oneOf, validationResult } = require('express-validator');
const channelDao = require('../channelDao');
const messagesDao = require('../messagesDao');
const userDao = require('../userDao');
const router = express.Router();
const syncDao = require('../syncDao');

//setting docs


//$FlowFixMe
router.get('/', (req, res) =>{
  res.send('Sync Api');
}); 




//$FlowFixMe
router.post('/sync',[
  body('token', 'No token given').trim().isLength({ min: 3 }).bail(),
  body('data', 'Data required, please send blank array if none').notEmpty().bail(),
  body('token', 'Token is not valid')
    .custom( async (value, {req}) => {
      //$FlowFixMe
      const res = await utils.checkProperToken(value);
      if(res.ok) {
        req.user = res.data;
        req.sendername = res.data.username;
        return true;
      }
      else
        throw new Error('Token is not valid');
  }),
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return utils.sendErrorFromExpressValidaiton(errors.array(), res);
   

  const data = req.body.data;
  //make sure it has correct structure
  if(!data.channels) data.channels = {};
  if(!data.checkpoints) data.checkpoints = {};

  console.log('Sync Data: ', data);
  // first save data
  const resSave = await syncDao.saveDocs(
    data.channels, req.user, req.app.apidb);

  // get return data
  const resLoad = await syncDao.loadUserNewDocs(
    data.checkpoints, req.user, req.app.apidb);

  console.log(resLoad);

  utils.sendRes(res, 'OK', {types: resLoad.types, checkpoints: resLoad.channels});
});



module.exports = router;