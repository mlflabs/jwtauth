const nano = require('nano')('http://mike:pass@localhost:5984');
const chai = require("chai");
const chaiHttp = require("chai-http");
const { expect } = chai;
chai.use(chaiHttp);

const auth_base_url = 'http://localhost:3002';

const req = chai.request(auth_base_url);

const usersDatabase = 'a_users';
const channelDatabase = 'a_channels';
const apiDatabase = 'a';

const userdb = nano.db.use(usersDatabase);
const channeldb = nano.db.use(channelDatabase);
const apidb = nano.db.use(apiDatabase);

let test1;
let test2;
let test3;
let test4;
let test5;

describe('All in one test', () => {

  before(async () => {
    console.log('Re-Setting databases')
    // delete all the contents of db
    await nano.db.destroy('a_users')
    await nano.db.destroy('a_channels')
    await nano.db.destroy('a')
    // create brand new databases
    console.log('Creating Databases');
    // Channels Database
    await nano.db.create(channelDatabase)
  
    try {
      await nano.db.create(apiDatabase);
      const db = nano.db.use(apiDatabase);
      await db.createIndex( { index: { fields: ['channel', 'updated'],},
                              name: 'timestampindex'
                            });
    }
    catch(e){
      console.log(e.message);
    }
  
    try {
      await nano.db.create(usersDatabase)
      const db = nano.db.use(usersDatabase);
      await userdb.createIndex({index: {fields: ['email'],}});
      await userdb.createIndex({ index: { fields: ['username'] }});
    }
    catch(e) {
      console.log(e.message)
    }
  })
    
  


//auth system online
describe ('Auth System', () => {
  it('Auth is online', async () => {
        const ready = await req.get('/auth');
        expect(ready.status).to.equal(200);
  });

  it('Register Users', async () => {
    const ready = await req.get('/auth/');
    console.log(ready);
  });
})





});


