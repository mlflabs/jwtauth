const utils = require('./utils');
const shortid = require('shortid');
const userDao = require('./userDao');
const  channelDao = {};



channelDao.uniqueChannel = async (channel, channeldb) => {
  try{
    const c = await channeldb.get(generateChannelId(channel));
    return false;
  }
  catch(e) {
    // console.log('GetUser Error: ', e.message);
    return true;
  }
}

const generateChannelId = (channel) => {
  return 'channel||' + channel + '|'
}

const getChannelError = () => {
  return utils.getRessult(false, null, [utils.getError('Error saving channel', 'channel')]);;
}


channelDao.saveChannel = async (user, app, channeldb, userdb, read=true, write=true, admin=true) => {
  try{

    let unique = false;
    let channel = '';
    while(!unique) {
      channel = app+'|'+shortid.generate();
      unique = await channelDao.uniqueChannel(channel, userdb);
    }

    console.log('Save channel: ', channel );
    const res = await channeldb.insert({ 
      _id: generateChannelId(channel), 
      creator: user._id, 
      date: Date.now()
    });
    console.log(res);
    if(res.ok != true)
      return getChannelError();

    const userres = await userDao.addChannel(user._id, channel, userdb, '1000');

    if(!userres){
      channeldb.destroy({_id: res.id, _rev: res.rev});
      return getChannelError();
    }
      
    return utils.getRessult(true, channel)
  }
  catch(e){
    console.log('Save Channel Error: ', e);
    return getChannelError();
  } 
}


module.exports = channelDao;