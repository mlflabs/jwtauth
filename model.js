
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;


export class  UserDoc {
  _id;
  _rev;
  _deleted;
  updated;

  username;
  loginCode;

  strategies = {
    basic: {
      email,
      passowrd
    }
  }

  constructor(values = {}) {
    Object.assign(this, values);
  }

  setPassword = (pass) => {
    //const user = this;
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }

  isValidPassword = async function(password){
    const user = this;
    //Hashes the password sent by the user for login and checks if the hashed password stored in the 
    //database matches the one sent. Returns true if it does else false.
    const compare = await bcrypt.compare(password, user.password);
    return compare;
  }
};

