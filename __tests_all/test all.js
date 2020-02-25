const frisby = require('frisby');
const data = require('../__tests_all/testDataValues')
const todos = require('../__tests_all/todo');
const parties = require('../__tests_all/parties');

jest.setTimeout(1000 * 60 * 10 * 1000);

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
    await db.createIndex({index: {fields: ['email'],}, name:'emailindex'});
    await db.createIndex({ index: { fields: ['username'] }, name: 'usernameindex'});
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

  await data.loadUsers();
});

  it('Full System Online ', async ()  => {
      const res = await frisby.get(data.auth_base_url)
        .expect('status', 200);
      return res;  
    }
  );

  //here we can load any other non sequential tests, before the run function
  it('None sequential tests', async ()  => {

  })

  it('Sequential tests', async ()  => {
      const  run = async () => {
        await todos();
        await parties();
      }
      await run();
  })





