const utils = require('./utils');
const syncDao = {};



syncDao.getPermissions = (channel, user) => {
   //first check if its users
   if(channel === utils.getUserChannelNameFromUser(user)) return {channel: true, child: true};

   //TODO
   //next test by channels
   //does the user have this channel
   if(user[process.env.ACCESS_META_KEY][channel]){
    return {
      channel: utils.canEditChannel(
        user[process.env.ACCESS_META_KEY][channel]),
      child: utils.canEditChildItem(
        user[process.env.ACCESS_META_KEY][channel]),
    }
   }

   return {channel: false, child: false}
}

//if its ok, get the rev for saving
//also check if its a system doc
const isDocStaleAndGet_Rev = async (doc, timestamp, apidb) => {
  try {
    const res = await apidb.get(doc._id);
    if(res.type === 'system') return false;

    if(res.updated > doc.updated) return false; //if our doc time is lower then old doc
                                                // means we didn't load latest doc

    return {...doc, ...{ _rev: res._rev, updated: timestamp }};
    console.log(res);
  }
  catch(e) {
    //if we are here, no doc found, don't neeed _rev, can edit
    return {...doc, ...{ updated: timestamp }};
    //return false;
  }
}

//format the doc with right _id address
//TODO channel is reserved for internal use
const formatDocForInternalProcessing = async (doc, channel) => {
  //extract channel, uuid from the main id, this is for security reasons

  const uuid = doc.id.substring(doc.id.indexOf(process.env.DIV)+1);  //(process.env.DIV)[1];
  return {...doc, ...{_id: channel+process.env.DIV+uuid, channel, uuid}};

}

// organize by type
const formatDocsByTypeForExport = async(docs) => {
  const newdocs = {};
  const channels = {};
  for(let i = 0; i < docs.length; i++){
    if(!newdocs[docs[i].type]) newdocs[docs[i].type] = [];
    if(!docs[i].id) docs[i].id = docs[i]._id
    const channel = docs[i].channel;
    delete docs[i]._rev;
    delete docs[i]._id;
    delete docs[i].uuid;
    delete docs[i].channel;
    newdocs[docs[i].type].push(docs[i]);
    if(!channels[channel]) channels[channel] = 0;
    if(channels[channel] < docs[i].updated)
      channels[channel] = docs[i].updated;
  }
  console.log(newdocs, channels);
  return {types: newdocs, channels};
}


syncDao.loadUserNewDocs  = async (checkpoints, user, apidb) => {
  //load all our channels to scan
  const channels = user[process.env.ACCESS_META_KEY];
  // add user channel
  channels[utils.getUserChannelNameFromUser(user)] = '1000';
  const keys = Object.keys(channels);
  console.log(channels);
  let docs = [];
  for(let i = 0; i < keys.length; i++) {
    //TODO: check if user can read this.
    try {
      const checkpoint = checkpoints[keys[i]] || 0; //if not given, load everything
      const res = await apidb.find({
        selector: {
          channel: {"$eq": keys[i]},
          updated: {"$gt": checkpoint}
        }
      });
     console.log(res);
     for(let x = 0; x < res.docs.length; x++) {
       console.log(res.docs[x].updated, checkpoint);
       console.log(res.docs[x].updated - checkpoint)
     }
     
     docs.push(...res.docs);
    }
    catch (e){
      console.log(e);
    }
  }
  console.log(docs);
  return formatDocsByTypeForExport(docs);

}


syncDao.saveDocs = async (docs, user, apidb) => {
  console.log(docs, user);
  const keys = Object.keys(docs);
  for(let i = 0; i < keys.length; i++) {
    // check if proper permissions
    
    const perms = syncDao.getPermissions(keys[i],  user);
    if(perms.channel === false && perms.child === false) {
      console.log('No permissions for: ', keys[i]);
    }
    else {
      let newDocs = [];
      const channel = keys[i];
      let newdoc;
      let logdoc;
      const timestamp = Date.now();
      for(let x = 0; x < docs[channel].length; x++) {
        //if its system doc continue
        newdoc = docs[channel][x];
        newdoc = await formatDocForInternalProcessing(newdoc, channel, apidb);
        if(!newdoc) continue;
        newdoc = await isDocStaleAndGet_Rev(newdoc, timestamp,  apidb);
        //if(!newdoc) continue;
        //logdoc  = await getChangeLogDoc(newdoc, channel, apidb);
        if(newdoc)
          newDocs.push(newdoc);
        //newDocs.push(logdoc);
      }
      let res = {};
      if(newDocs.length > 0)
        res = await apidb.bulk({docs: newDocs});
      console.log(res);
      return res;
    }
  }
}


module.exports = syncDao;