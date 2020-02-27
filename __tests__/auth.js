// flowlint sketchy-null:off
// flowlint untyped-type-import:off
// flowlint sketchy-null:off
const frisby = require('frisby');
//$FlowFixMe
const data = require('../__tests_all/testDataValues').default

const auth = () => {
    describe('AUTH System', () => {
      it('Auth Test', async ()  => {
          const res = await frisby.get(data.auth_base_url+ '/auth')
            .expect('status', 200);
          return res;  
        }
      );

      it('Auth Incorect Calls', async ()  => {
          let res = frisby.post(data.auth_base_url+ '/auth/register', {
            password:'123',
            username:'test',
            email:'test123'
          }).expect('status', 422);
        })

        it('Auth Incorect Calls - Email', async ()  => {
          let res = frisby.post(data.auth_base_url+ '/auth/register', {
            password:'12332',
            username:'test1234',
            email:'test123'
          }).expect('status', 422);
        })

        it('Auth Create test users', async ()  => {
            

            res = await frisby.post(data.auth_base_url+ '/auth/register', {
                password:'pass',
                username:'test1',
                email:'test11@test.com'
              })    
              expect(res.json.success).toBe(false);
              expect(res.status).toBe(422);

              res = await frisby.post(data.auth_base_url+ '/auth/register', {
                password:'pass',
                username:'test11',
                email:'test1@test.com'
              })   
              expect(res.json.success).toBe(false);
              expect(res.status).toBe(422);

        })

        it('Auth login - no app', async ()  => {
          res = await frisby.post(data.auth_base_url+ '/auth/login', {
            id:'test',
            password:'pass',
            
          }) 
          expect(res.json.success).toBe(false);
          expect(res.status).toBe(422);
        })

        it('Auth login - wrong info', async ()  => {
          res = await frisby.post(data.auth_base_url+ '/auth/login', {
            id:'test32',
            password:'pass',
            app: 'hv',
          }) 
          expect(res.json.success).toBe(false);
          expect(res.status).toBe(422);
        })

        it('Auth login - wrong info', async ()  => {
          res = await frisby.post(data.auth_base_url+ '/auth/login', {
            id:'test222@test.com',
            password:'pass',
            app: 'hv',
          }) 
          expect(res.json.success).toBe(false);
          expect(res.status).toBe(422);
        })

        it('Auth login - email wrong pass', async ()  => {
          res = await frisby.post(data.auth_base_url+ '/auth/login', {
            id:'test1@test.com',
            password:'pass1',
            app: 'hv',
          }) 
          expect(res.json.success).toBe(false);
          expect(res.status).toBe(422);
        })

        it('Auth login - username wrong pass', async ()  => {
          res = await frisby.post(data.auth_base_url+ '/auth/login', {
            id:'test1',
            password:'pass1',
            app: 'hv',
          }) 
          expect(res.json.success).toBe(false);
          expect(res.status).toBe(422);
        }) 
    })
  
}

auth();
module.exports = auth;

