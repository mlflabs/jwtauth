const shortid = require('shortid');

const messagesDao = {};

//to, from, points to username, not id
messagesDao.getMsg = (to, from, messageType, message, data) => {

  return {to, from, messageType, message, data}
}

messagesDao.sendMessage = async (toId, msg, messagesdb) => {
  try {
    const uuid = shortid.generate();
    const doc = {...{
      _id: 'msg|'+toId+'|'+Date.now()+'|'+uuid,
      date: Date.now(),
      [process.env.ACCESS_META_KEY]: ['u|'+toId+'|'],
    }, ...msg}
    const res = await messagesdb.insert(doc)
    if(res.ok) return true;
    return false;
  }
  catch(e) {
    console.log(e);
    return false;
  }
}

//fromDate can be timestamp
messagesDao.getMessages = async (username, timestamp, messagesdb) => {
  try {
    const res = await messagesdb.list({
      startkey: 'msg|' + username + '|' + timestamp,
      endkey: 'msg|' + username + '|z',
      include_docs: true,
    });

    return res.rows.map(row => row.doc);
  }
  catch(e) {
    console.log(e);
    return false;
  }
}







module.exports = messagesDao;

