const nano = require('nano')('http://mike:pass@localhost:5984');
const frisby = require('frisby');

class Data {
  constructor() {
    this.test1 = {};
    this.test2 = {};
    this.test3 = {};
    this.test4 = {};
    this.test5 = {};

    this.nano = nano;
    this.auth_base_url = 'http://localhost:3002';
    this.sync_base_url = 'http://localhost:3002';
    this.usersDatabaseName = 'a_users';
    this.channelDatabaseName = 'a_channels';
    this.apiDatabaseName = 'a';

    this.userdb = nano.db.use(this.usersDatabaseName);
    this.channeldb = nano.db.use(this.channelDatabaseName);
    this.apidb = nano.db.use(this.apiDatabaseName);


  };

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