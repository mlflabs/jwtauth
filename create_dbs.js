


const createDatabases = (nano) => {

// Channels Database
nano.db.create(process.env.CHANNEL_DB)
  .then((body) => {
    console.log('database ' + process.env.CHANNEL_DB + ' created!');
  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });



  // API Database
  nano.db.create(process.env.API_DB)
  .then((body) => {
    console.log('database ' + process.env.API_DB + ' created!');
    const db = nano.db.use(process.env.API_DB);
    try{
      
      db.createIndex({
        index: {
          fields: ['channel', 'updated'],
        },
        name: 'timestampindex'
      });
    }
    catch(e){
      console.log('Preping Database: ', e.message);
    }


  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });


  // Social Database
  nano.db.create(process.env.SOCIAL_DB)
  .then((body) => {
    console.log('database ' + process.env.SOCIAL_DB + ' created!');
  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });




  // User database
  nano.db.create(process.env.USER_DB)
  .then((body) => {
    console.log('database ' + process.env.USER_DB + ' created!');
    const userdb = nano.db.use(process.env.USER_DB);
    try{
      
      userdb.createIndex({
        index: {
          fields: ['email'],
        },
        name: 'emailindex'
      });
    }
    catch(e){
      console.log('Preping Database: ', e.message);
    }
    try{
      userdb.createIndex({
        index: {
          fields: ['username'],
        },
        name: 'usernameindex'
      });
    }
    catch(e){
      console.log('Preping Database: ', e.message);
    }
    
  })
  .catch(err => {
    console.log('Preping Database: ', err.message);
  });

}

module.exports = createDatabases;