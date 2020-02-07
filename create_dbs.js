


const createDatabases = (nano) => {

// Channels Database
nano.db.create(process.env.CHANNEL_DB)
  .then((body) => {
    console.log('database ' + process.env.CHANNEL_DB + ' created!');
  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });



  // Messages Database
  nano.db.create(process.env.API_DB)
  .then((body) => {
    console.log('database ' + process.env.API_DB + ' created!');

  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });



  // User database
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

}

module.exports = createDatabases;