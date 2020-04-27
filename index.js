require('dotenv').config();
const db = require('./db');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();

//$FlowFixMe
app.use(cors());

const nano = require('nano')(process.env.COUCHDB);

const createDatabases = require('./create_dbs');
createDatabases(nano);

//create our databases
//$FlowFixMe
app.userdb = nano.db.use(process.env.USER_DB);
//$FlowFixMe
app.channeldb = nano.db.use(process.env.CHANNEL_DB);
//$FlowFixMe
app.apidb = nano.db.use(process.env.API_DB);
//$FlowFixMe
app.socialdb = nano.db.use(process.env.SOCIAL_DB);

//$FlowFixMe
db.userdb = app.userdb;
//$FlowFixMe
db.channeldb = app.channeldb;
//$FlowFixMe
db.apidb = app.apidb;
db.socialdb = app.socialdb;

//$FlowFixMe
app.use(bodyParser.json());
//$FlowFixMe
app.use(bodyParser.urlencoded({
  extended: false
}));


const auth_routes = require('./routes/auth');
const channel_routes = require('./routes/channels');
const messages_routes = require('./routes/messages');
const sync_routes = require('./routes/sync');
const habitvile_routes = require('./routes/habitville')
const social_routes = require('./routes/social');
//Handle errors
//$FlowFixMe
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});
 
//$FlowFixMe
app.get('/', (req, res, next) => {
 res.send('MLF Auth System');
});

//$FlowFixMe
app.use('/auth', auth_routes);
//$FlowFixMe
app.use('/channels', channel_routes);
//$FlowFixMe
app.use('/msg', messages_routes);
//$FlowFixMe
app.use('/sync', sync_routes);
//$FlowFixMe
app.use('/social', social_routes);
//$FlowFixMe
app.use('/habits', habitvile_routes);


module.exports = app; 

//$FlowFixMe
app.listen(process.env.PORT, () => {
  console.log('Server started port:', process.env.PORT);
});