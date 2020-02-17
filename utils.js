const jwt = require('jsonwebtoken');
const userDao = require('./userDao');

const utils = {}

utils.sendRes = (res, msg = "", data={}) => {
  return res.json({...{success: true, msg}, ...data});
}

utils.getError = (msg, location) => {
  return {msg, location};
}

utils.getRessult = (ok, data = null, errors = null, errorCode = 422) => {
  return {ok, data, errors}
}

utils.sendErrorFromResult = (errRes, res) => {
  return res.status(errRes.errorCode).json({success: false,  errors: errRes.errors})
}

utils.sendErrorFromExpressValidaiton = (errors, res) => {
  return res.status(422).json({success:false, errors});
}

utils.sendError = (location, msg, res, errorCode=422) => {
  return res.status(errorCode).json({success: false, errors:[{location, msg}]});
}

//if ok, also returns userdoc
utils.checkProperToken = async (token) => {
  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET)
    console.log('PAYLOAD:: ', payload);
    if(Date.now() > Number(payload.refresh)){
      return utils.getRessult(false, null, [utils.getError('token', 
        'Token expired.', 401)]);
    }

    return utils.getRessult(true, payload)
  }
  catch(e) {
    console.log(e);
    return utils.getRessult(false, null, [utils.getError('database', 
        'Error saving, please wait and try again later.')]);
  }
}

utils.getTokenPayload =  (token) => {
  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET )


    return payload;
  }
  catch(e) {
    console.log(e);
    return false;
  }
}
    /*
      Rights, each digit represents different right
      0.  0 - Not admin 1- Admin, can change everything
      1.  (Project item) 0 - can't see, 1 - can see, 2 - can edit
      2.  (Project children) 0 - can't see, 1 - can see own, 2 - can see all items
      3.  (Project children edit) 0 -can't edit, 1 can edit/make own, 2 can edit all 
    */

utils.isAdmin = (rights) => {
  if(rights.substring(0,1)=== '1') return true;
  return false;
}

utils.isChannel = (id) => {

}

const DIV = process.env.DIV;
const CHANNEL_SUFFIX = process.env.CHANNEL_SUFFIX; 

utils.canEditChannel = (rights) => {
  if(rights.substring(0,1)=== '1') return true;
  if(rights.substring(1,1)=== '2') return true;
  return false;
}

//basic function, assumes rights belong to user, id is user id, item 
//has creator prop with creator id
utils.canEditChildItem = (item, rights, id) => {
  if(rights.substring(0,1)=== '1') return true;
  if(rights.substring(3,1) === '2') return true;
  if(rights.substring(3,1) === '1' && item.creator === id) return true;
  return false;
}

utils.getUserChannelNameFromUser = (user) => {
  return  process.env.CHANNEL_USER_PREFIX + 
          user.app + user.id;
}

utils.getUserChannelName = (id, app) => {
  return  process.env.CHANNEL_USER_PREFIX + 
          app + id;
}

utils.getChannelDocId = (channel) => {
  return  channel +  
          process.env.DIV +
          process.env.CHANNEL_SUFFIX;
}

utils.checkDocStructureBeforeSave = (doc) => {
  if(!doc._id) throw new Error('doc._id is required');
  if(!doc.updated) throw new Error('doc.updated is required');
  if(!doc.channel) throw new Error('doc.channel is required');
  if(!doc.type) throw new Error('doc.type is required');
  return doc;
}


module.exports = utils;