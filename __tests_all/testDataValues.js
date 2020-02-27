
//$FlowFixMe
const nano = require('nano')('http://mike:pass@localhost:5984');
//$FlowFixMe
const frisby = require('frisby');

class Data {

  test1 = {};
  test2 = {};
  test3 = {};
  test4 = {};
  test5 = {};

  nano = nano;
  auth_base_url = 'http://localhost:3002';
  sync_base_url = 'http://localhost:3002';
  usersDatabaseName = 'a_users';
  channelDatabaseName = 'a_channels';
  apiDatabaseName = 'a';

  userdb = nano.db.use(this.usersDatabaseName);
  channeldb = nano.db.use(this.channelDatabaseName);
  apidb = nano.db.use(this.apiDatabaseName);


  async refreshTokens() {
    await loadUsers();
  }

  async loadUsers() {
    await createUsers();
    await loadUsers();
  }

  waitMS(ms){
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
}


const createUsers = async () => {

  let res;
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

}

const loadUsers = async () => {
  let res;
  // load all users
  res = await frisby.post(data.auth_base_url+ '/auth/login', {
        id:'test1',
        password:'pass',
        app: 'hv',
  }) 
  //console.log(res);
  data.test1 = {id: res.json.id, token: res.json.token, app: 'hv'}


  res = await frisby.post(data.auth_base_url+ '/auth/login', {
        id:'test2',
        password:'pass',
        app: 'hv',
  }) 
  //console.log(res);
  data.test2 = {id: res.json.id, token: res.json.token, app: 'hv'}

  res = await frisby.post(data.auth_base_url+ '/auth/login', {
        id:'test3@test.com',
        password:'pass',
        app: 'hv',
  }) 
  //console.log(res);
  data.test3 = {id: res.json.id, token: res.json.token, app: 'hv'}

  res = await frisby.post(data.auth_base_url+ '/auth/login', {
        id:'test4',
        password:'pass',
        app: 'hi',
  }) 
  //console.log(res);
  data.test4 = {id: res.json.id, token: res.json.token, app: 'hi'}

  res = await frisby.post(data.auth_base_url+ '/auth/login', {
        id:'test5@test.com',
        password:'pass',
        app: 'hi',
  }) 
  //console.log(res);
  data.test5 = {id: res.json.id, token: res.json.token, app: 'hi'}

}

const data = new Data();
// Object.freeze(data);
module.exports = data;