const frisby = require('frisby');
const data = require('./testDataValues').default


const parties = async () => {
    let res;

    //TODO: make some tests for parties, put it into channels tests
    // load users
    //data.loadUsers();

    //Create our parties
    const p1 = await frisby.post(data.auth_base_url+ '/channels/addNewChannel', {
      token: data.test1.token,
      doc: {
        created: 1582116609701,
        updated: 1582116609701,
        type: "party",
        dirty: 0,
        note: "Here is a description of the channel, maybe put in a start date",
        access: [],
        secondaryType: "project",
        creator: "",
        members: [],
        moneyTypeSingle: "Ruby",
        moneyTypeMultiple: "Rubies",
        moneyColor: "#ff0000",
      },
      name: "Cool Party",
    });
    const p2 = await frisby.post(data.auth_base_url+ '/channels/addNewChannel', {
      token: data.test1.token,
      doc: {
        created: 1582116609701,
        updated: 1582116609701,
        type: "party",
        dirty: 0,
        note: "This is another party, starting soon",
        access: [],
        secondaryType: "project",
        creator: "",
        members: [],
        moneyTypeSingle: "Penny",
        moneyTypeMultiple: "Pennies",
        moneyColor: "#00ff00",
      },
      name: "Cool Party 2",
    });
    const p3 = await frisby.post(data.auth_base_url+ '/channels/addNewChannel', {
      token: data.test2.token,
      doc: {
        created: 1582116609701,
        updated: 1582116609701,
        type: "party",
        dirty: 0,
        note: "Here is a description of the channel, maybe put in a start date",
        access: [],
        secondaryType: "project",
        creator: "",
        members: [],
        moneyTypeSingle: "Ruby",
        moneyTypeMultiple: "Rubies",
        moneyColor: "#ff0000",
      },
      name: "Test 2 Party",
    });


    expect(p1.json.success).toBe(true);
    expect(p2.json.success).toBe(true);
    expect(p3.json.success).toBe(true);
    expect(p1.status).toBe(200);

    //reload the users, we need new tokens
    await data.refreshTokens();

    //send requests to join
    const u1r2 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      token: data.test1.token,
      channelid: p1.json.channel,
      id: data.test2.id,
      rights: '0121',
    });
    const u1r3 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      token: data.test1.token,
      channelid: p1.json.channel,
      id: data.test3.id,
      rights: '0121',
    });
    const u1r4 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      token: data.test1.token,
      channelid: p1.json.channel,
      id: data.test4.id,
      rights: '0121',
    });

    const u2r1 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      token: data.test2.token,
      channelid: p3.json.channel,
      id: data.test1.id,
      rights: '0121',
    });

    expect(u1r2.json.success).toBe(true);
    expect(u1r3.json.success).toBe(true);
    expect(u1r4.json.success).toBe(true);
    expect(u2r1.status).toBe(200);

    //get messages from sync, see if we have joint party request
    const syncTest1 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      token: data.test1.token,
      data: {},
    });
    const syncTest2 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      token: data.test2.token,
      data: {},
    });

    const syncTest3 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      token: data.test3.token,
      data: {},
    });

    const syncTest4 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      token: data.test4.token,
      data: {},
    });

    const syncTest5 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      token: data.test5.token,
      data: {},
    });

    expect(syncTest1.json.success).toBe(true);
    expect(syncTest2.json.success).toBe(true);
    expect(syncTest3.json.success).toBe(true);
    expect(syncTest4.json.success).toBe(true);
    expect(syncTest5.json.success).toBe(true);

    //now see all our request invitation messages
    const msgs1 = syncTest1.json.types.msg;
    expect(msgs1).toBeDefined();
    const msgs2 = syncTest2.json.types.msg;
    expect(msgs2).toBeDefined();
    const msgs3 = syncTest3.json.types.msg;
    expect(msgs3).toBeDefined();
    const msgs4 = syncTest4.json.types.msg;
    expect(msgs4).toBeUndefined();
    const msgs5 = syncTest5.json.types.msg;
    expect(msgs5).toBeUndefined();

    const acceptInvite = [];
    //run through test1 mesgs, look for invite
    for(let i = 0; i < msgs1.length; i ++) {
      if(msgs1[i].messageType === 'channelinvite'){
        acceptInvite[msgs1[i].to] = 
          await frisby.post(data.auth_base_url+ '/channels/acceptChannelInvitation', 
          {
            token: data.test1.token,
            msgId: msgs1[i].id,
          });
      }
    }
    for(let i = 0; i < msgs2.length; i ++) {
      if(msgs2[i].messageType === 'channelinvite'){
        acceptInvite[msgs2[i].to] = 
          await frisby.post(data.auth_base_url+ '/channels/acceptChannelInvitation', 
          {
            token: data.test2.token,
            msgId: msgs2[i].id,
          });
      }
    }

    for(let i = 0; i < msgs3.length; i ++) {
      if(msgs3[i].messageType === 'channelinvite'){
        acceptInvite[msgs3[i].to] = 
          await frisby.post(data.auth_base_url+ '/channels/acceptChannelInvitation', 
          {
            token: data.test3.token,
            msgId: msgs3[i].id,
          });
      }
    }

    console.log(acceptInvite);




    //send requests to join
    



}


module.exports = parties
