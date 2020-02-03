require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')
const app = express();
app.use(cors());

const nano = require('nano')(process.env.COUCHDB);

//create our database
nano.db.create(process.env.USER_DB)
  .then((body) => {
    console.log('database ' + process.env.USER_DB + ' created!');
    try{
      app.userdb.createIndex({
        index: {
          fields: ['email'],
        }
      });
    }
    catch(e){
      console.log('Preping Database: ', err.message);
    }
    try{
      app.userdb.createIndex({
        index: {
          fields: ['username'],
        }
      });
    }
    catch(e){
      console.log('Preping Database: ', err.message);
    }
    
  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });


//create our databases
app.userdb = nano.db.use(process.env.USER_DB);

app.use(bodyParser.urlencoded({ extended : false }) );
app.use(bodyParser.json());

const auth_routes = require('./routes/auth');

//We plugin our jwt strategy as a middleware so only verified users can access this route
//app.use('/user', passport.authenticate('jwt', { session : false }), secureRoute );
 
//Handle errors
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error : err });
});
 
app.get('/', (req, res, next) => {
 res.send('MLF Auth System');
});

app.use('/auth', auth_routes);


app.listen(process.env.PORT, () => {
  console.log('Server started port:', process.env.PORT);
});

