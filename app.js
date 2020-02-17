require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
app.use(cors());

const nano = require('nano')(process.env.COUCHDB);

const createDatabases = require('./create_dbs');
createDatabases(nano);

//create our databases
app.userdb = nano.db.use(process.env.USER_DB);
app.channeldb = nano.db.use(process.env.CHANNEL_DB);
app.apidb = nano.db.use(process.env.API_DB);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


const auth_routes = require('./routes/auth');
const channel_routes = require('./routes/channels');
const messages_routes = require('./routes/messages');
const sync_routes = require('./routes/sync');
//Handle errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});
 
app.get('/', (req, res, next) => {
 res.send('MLF Auth System');
});

app.use('/auth', auth_routes);
app.use('/channels', channel_routes);
app.use('/msg', messages_routes);
app.use('/sync', sync_routes);



module.exports = app; 

