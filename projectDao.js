const shortid = require('shortid');

const projectDao = {};

//project members structure
//project.members: [{id:###, username:###, rights: 1234}]

projectDao.addMemberToProject = async (projectid, userDoc, rights, apidb) => {
  try {
    const project = await apidb.get(projectid);
    if(!project) return false;

    if(!project.members) project.members = [];
    project.members.push({id: userDoc._id, username: userDoc.username, rights});

    const res = await apidb.insert(project);
    if(res.ok) return true;
    return false;
  }
  catch(e) {
    console.log(e);
    return false;
  }

}




module.exports = projectDao;

