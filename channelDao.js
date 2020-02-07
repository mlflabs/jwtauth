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

channelDao.checkIfRequestAlreadySent = async (userid, memberid, channel, channeldb) => {
  try {
    const res = await channeldb.list({
      startkey: 'request|' + memberid + '|' + channel +'|' + userid + '|',
      endkey: 'request|' + memberid + '|' + channel +'|' + userid + '|z',
      include_docs: true,
    })

    console.log(res);
    
    if(res.rows.length == 0) return false;

    let duplicate = false;
    res.rows.forEach(r => {
       const doc = r.doc;
       //did the user reply to this request
       if(doc['replied'])
        return;
      
       //was this request older than 1 day
       const diff = Date.now() - doc.date;
       if(diff > 86400000)
        return;
       duplicate = true;
    });
    
    return duplicate;
  }
  catch(e) {
    console.log(e);
    return false;
  }
}


channelDao.saveAddMemberRequest = async (memberid, data, channeldb) => {
  try{

    const unique = shortid.generate();

    const doc = {
     ... { _id: 'request|' + memberid + '|' + data.channel +'|' + data.host + '|' + Date.now() },
     ... data
    }

    const res = await channeldb.insert(doc)

    if(res.ok == true)
      return true;
    return false;
  
  }
  catch(e){
    console.log('Save Channel Error: ', e);
    return false;
  } 
}

channelDao.getChannel = async (channel, channeldb) => {
  try {
    const doc = await channeldb.get(generateChannelId(channel));
    console.log(channel);
    return doc
  }
  catch(e){
    console.log(e);
    return null;
  }
}


channelDao.saveChannel = async (user, app, name, channeldb, userdb, read=true, write=true, admin=true) => {
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
      name: name,
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