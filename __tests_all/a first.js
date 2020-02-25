const frisby = require('frisby');
const data = require('./testDataValues')




beforeAll(async () => {
  console.log('Re-Setting databases')
  // delete all the contents of db
  await data.nano.db.destroy(data.usersDatabaseName)
  await data.nano.db.destroy(data.channelDatabaseName)
  await data.nano.db.destroy(data.apiDatabaseName)
  // create brand new databases
  console.log('Creating Databases');
  await data.nano.db.create(data.channelDatabaseName)
  try {
    await data.nano.db.create(data.apiDatabaseName);
    const db = data.nano.db.use(data.apiDatabaseName);
    await db.createIndex( { index: { fields: ['channel', 'updated'],},
                            name: 'timestampindex'
                          });
  }
  catch(e){
    console.log(e.message);
  }

  try {
    await data.nano.db.create(data.usersDatabaseName)
    const db = data.nano.db.use(data.usersDatabaseName);
    await userdb.createIndex({index: {fields: ['email'],}});
    await userdb.createIndex({ index: { fields: ['username'] }});
  }
  catch(e) {
    console.log(e.message)
  }
  

  //create users
  res = await frisby.post(data.auth_base_url+ '/auth/register', {
    password:'pass',
    username:'test1',
    email:'test1@test.com'
  })    

   //user 2
   res = await frisby.post(data.auth_base_url+ '/auth/register', {
    password:'pass',
    username:'test2',
    email:'test2@test.com'
  })   
  //user 3
  res = await frisby.post(data.auth_base_url+ '/auth/register', {
    password:'pass',
    username:'test3',
    email:'test3@test.com'
  })   
  //user 4
  res = await frisby.post(data.auth_base_url+ '/auth/register', {
    password:'pass',
    username:'test4',
    email:'test4@test.com'
  })    
   //user 5
   res = await frisby.post(data.auth_base_url+ '/auth/register', {
    password:'pass',
    username:'test5',
    email:'test5@test.com'
  }) 

  
});

describe('MLF System', () => {
  it('Full System Online ', async ()  => {
      const res = await frisby.get(data.auth_base_url)
        .expect('status', 200);
      return res;  
    }
  );
});