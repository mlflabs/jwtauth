const utils = require('./utils');
const shortid = require('shortid');
const userDao = require('./userDao');
const  channelDao = {};



channelDao.uniqueChannel = async (channel, channeldb) => {
  //channels can't start with 'u' thats reserved for user channels
  if(channel.substring(0,1) == 'u') return false;
  if(channel.substring(0,1) == '_') return false;
  if(channel.substring(0,1) == '-') return false;
  try{
    const c = await channeldb.get(generateChannelId(channel));
    return false;
  }
  catch(e) {
    // console.log('GetUser Error: ', e.message);
    return true;
  }
}

const formatChannelDocForExport = (doc) => {
  doc.id = doc._id;
  doc.dirty = 0;
  delete doc._id;
  //Todo: any other modifications?
  return doc;
}

const generateChannelId = (channel) => {
  return channel + process.env.DIV + process.env.CHANNEL_SUFFIX;
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
       if(diff > 86400000/24)
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

channelDao.getAddMemberRequest = async (memberid, hostid, channel, channeldb) => {
  try{
      const q = {
        startkey: 'request|' + memberid + '|' + channel +'|' + hostid + '|',
        endkey: 'request|' + memberid + '|' + channel +'|' + hostid + '|z',
        include_docs: true,
      }
      const res = await channeldb.list(q)
  
      console.log(res);
      
      if(res.rows.length == 0) return false;
  
      let request = false;
      res.rows.forEach(r => {
         const doc = r.doc;
         
         
         //it request is older than 30 days, its invalid
         const diff = Date.now() - doc.date;
         if(diff < 86400000 * 30){
           request = doc;
         }
      });
      
      return request;
    }
  catch(e) {
      console.log(e);
      return false;
  }
}

channelDao.saveAddMemberRequest = async (req, channeldb) => {
  try {
    const res = channeldb.insert(req);
    if(res.ok == true)return res;
    return false;
  }
  catch(e) {
    console.log(e);
    return false;
  }
}


channelDao.saveAddNewMemberRequest = async (memberid, data, channeldb) => {
  try{
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

channelDao.addMemberToChannel = async (channelid, user, rights, apidb) => {
  try {
    const channel = await apidb.get(channelid);
    if(!channel) return false;

    if(!channel.members) project.members = [];
    channel.members.push({id: user.id, username: user.username, rights});

    const res = await apidb.insert(channel);
    if(res.ok) return true;
    return false;
  }
  catch(e) {
    console.log(e);
    return false;
  }

}

channelDao.getChannel = async (channel, channeldb) => {
  try {
    //create id
    const id = generateChannelId(channel)
    const doc = await channeldb.get(id);
    console.log(channel);
    return doc
  }
  catch(e){
    console.log(e);
    return null;
  }
}

channelDao.saveChannel = async (channel, channeldb) => {
  try {
    const res = channeldb.insert(utils.checkDocStructureBeforeSave(channel));
    if(res.ok == true)return res;
    return false;
  }
  catch(e) {
    console.log(e);
    return false;
  }
}


channelDao.saveMewChannel = async (user, app, name, doc, channeldb, userdb) => {
  try{

    let unique = false;
    let channel = '';
    while(!unique) {
      channel = app+shortid.generate();
      unique = await channelDao.uniqueChannel(channel, userdb);
    }

    console.log('Save channel: ', channel );
    const ddoc = Object.assign(doc, { 
      _id: generateChannelId(channel), 
      name: name,
      creator: user.id, 
      members: [{id: user.id, username: user.username, rights: '1000'}],
      updated: Date.now(),
      channel,
      date: Date.now()
    });
    const res = await channeldb.insert(utils.checkDocStructureBeforeSave(ddoc));
    console.log(res);
    if(res.ok != true)
      return getChannelError();

    const userres = await userDao.addChannel(user.id, channel, userdb, '1000');

    if(!userres){
      channeldb.destroy({_id: res.id, _rev: res.rev});
      return getChannelError();
    }
      
    return utils.getRessult(true, {channel, 
      doc: formatChannelDocForExport(ddoc)});
  }
  catch(e){
    console.log('Save Channel Error: ', e);
    return getChannelError();
  } 
}


module.exports = channelDao;