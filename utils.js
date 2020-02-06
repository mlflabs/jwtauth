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

utils.generateProjectId = (uuid) => {
  const id = process.env.PROJECT_SERVICE + '|' + process.env.PROJECT_SERVICE_INDEX + '|' + uuid;
}

//if ok, also returns userdoc
utils.checkProperToken = async (token, userdb) => {
  try {
    const payload = jwt.verify(token, process.env.TOKEN_SECRET )
    console.log('PAYLOAD:: ',payload);

    const userdoc = await userDao.getUser(payload.id, userdb);
    console.log('UserDOC: ', payload.id, userdoc);


    if(payload.code !== userdoc.loginCode){
      return utils.getRessult(false, null, [utils.getError('token',
              'Token code is not valid, please relogin.')])

    }

    return utils.getRessult(true, userdoc)
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

module.exports = utils;