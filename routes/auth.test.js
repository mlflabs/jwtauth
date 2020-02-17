const app = require('../app');
const supertest = require('supertest');
const request = require(app);

describe('Testing Auth', () => {
  beforeAll(() => {
    
  });

  afterAll((done) => {
      
  });

  it('Auth - Register', async done => {
    const res = await request.post('/auth/register'); 
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('pass!')
    done()
  });
  
  it('Testing to see if Jest works', () => {
    expect(1).toBe(1)
  })
  

})




