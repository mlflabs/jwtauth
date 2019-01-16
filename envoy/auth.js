const crypto = require('crypto')
const uuid = require('uuid')
//const app = require('../../../app')
const express = require('express')
const router = express.Router()
let dbName = null
let usersdb = null
const jwt = require('jsonwebtoken');

// called at startup
const init = (callback) => {
  console.log('auth init');

  callback();            
}

// returns the sha1 of a string
const sha1 = (string) => {
  return crypto.createHash('sha1').update(string).digest('hex')
}

// create a new user - this function is used by the
// test suite to generate a new user. Our envoyusers database
// follows a similar pattern to the CouchDB _users database
// but we perform the salt/hash process here
const newUser = (username, password, meta, callback) => {
  // leave this to outside process
}

// get an existing user by its id
const getUser = (id, callback) => {
  
  console.log('Envoy Auth, GetUser:: ', id);
  /*return new Promise((resolve, reject) => {
    usersdb.get(id, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
      if (typeof callback === 'function') {
        callback(err, data)
      };
    })
  })
  */
}

// Express middleware that is the gatekeeper for whether a request is
// allowed to proceed or not. It checks with Cloudant to see if the
// supplied Basic Auth credentials are correct and issues a session cookie
// if they are. The next request (with a valid cookie), doesn't need to
// hit the users database
const isAuthenticated = (req, res, next) => {
  console.log('test');
  //load user token from headers
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  console.log('isAuthenticated token: ', token);
  console.log('secret: ', process.env.TOKEN_SECRET);
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {       
      if (err) {
        console.log('isAuthenticated error: ', err);
        return unauthorized(res)  
      } else {
        next();
      }
    });

  } else {
    return unauthorized(res)
  }
}

const isPostAuthenticated = (req, res, next) => {
  console.log('isPostAuthenticated');
  // if the user has valid session then we're good to go
  // without hitting the _users database again
  if (req.session.user) {
    return next()
  }

  const user = {
    name: req.body.name,
    pass: req.body.password
  }
  if (!user || !user.name || !user.pass) {
    return unauthorized(res)
  }

  // validate user and save to session
  usersdb.get(user.name, (err, data) => {
    if (err || !data || data.password !== sha1(data.salt + user.pass)) {
      return unauthorized(res)
    } else {
      req.session.user = data
      return next()
    }
  })
}

// the response to requests which are not authorised
const unauthorized = (res) => {
  console.log('unauthorized');
  return res.status(403).send({ error: 'unauthorized', reason: 'Authentication error - please verify your username/password' })
}

// allow clients to see if they are logged in or not
const authResponse = (req, res) => {
  console.log('authResponse');
  res.send({
    loggedin: !!req.session.user,
    username: req.session.user ? req.session.user.name : null
  })
}
router.get('/_auth', isAuthenticated, authResponse)
router.post('/_auth', isPostAuthenticated, authResponse)

// and to log out
router.get('/_logout', (req, res) => {
  delete req.session.user
  res.send({ ok: true })
})

module.exports = () => {
  return {
    init: init,
    newUser: newUser,
    getUser: getUser,
    isAuthenticated: isAuthenticated,
    unauthorized: unauthorized,
    routes: router
  }
} 