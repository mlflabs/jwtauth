const frisby = require('frisby');
const data = require('./testDataValues')
const moment  = require('moment');
const MOMENT_DATE_FORMAT = process.env.MOMENT_DATE_FORMAT || 'YYYYMMDD';

const parties = async () => {
    let res;

    //TODO: make some tests for parties, put it into channels tests
    // load users
    //data.loadUsers();

    //Create our parties
    //$FlowFixMe
    const p1 = await frisby.post(data.auth_base_url+ '/channels/addNewChannel', {
      //$FlowFixMe
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
    //$FlowFixMe
    const p2 = await frisby.post(data.auth_base_url+ '/channels/addNewChannel', {
      //$FlowFixMe
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
    //$FlowFixMe
    const p3 = await frisby.post(data.auth_base_url+ '/channels/addNewChannel', {
      //$FlowFixMe
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
    //$FlowFixMe
    const u1r2 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      //$FlowFixMe
      token: data.test1.token,
      channelid: p1.json.channel,
      //$FlowFixMe
      id: data.test2.id,
      rights: '0121',
    });
    //$FlowFixMe
    const u1r3 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      //$FlowFixMe
      token: data.test1.token,
      channelid: p1.json.channel,
      //$FlowFixMe
      id: data.test3.id,
      rights: '0121',
    });
    //$FlowFixMe
    const u1r4 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      //$FlowFixMe
      token: data.test1.token,
      channelid: p1.json.channel,
      //$FlowFixMe
      id: data.test4.id,
      rights: '0121',
    });

    //$FlowFixMe
    const u2r1 = await frisby.post(data.auth_base_url+ '/channels/sendAddMemberRequest', {
      //$FlowFixMe
      token: data.test2.token,
      channelid: p3.json.channel,
      //$FlowFixMe
      id: data.test1.id,
      rights: '0121',
    });


    expect(u1r2.json.success).toBe(true);
    expect(u1r3.json.success).toBe(true);
    expect(u1r4.json.success).toBe(true);
    expect(u2r1.status).toBe(200);

    //get messages from sync, see if we have joint party request
    //$FlowFixMe
    const syncTest1 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      //$FlowFixMe
      token: data.test1.token,
      data: {},
    });
    //$FlowFixMe
    const syncTest2 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      //$FlowFixMe
      token: data.test2.token,
      data: {},
    });

    //$FlowFixMe
    const syncTest3 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      //$FlowFixMe
      token: data.test3.token,
      data: {},
    });

    //$FlowFixMe
    const syncTest4 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      //$FlowFixMe
      token: data.test4.token,
      data: {},
    });

    //$FlowFixMe
    const syncTest5 = await frisby.post(data.auth_base_url+ '/sync/sync', {
      //$FlowFixMe
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
        //$FlowFixMe
        acceptInvite[msgs1[i].id] = await frisby.post(data.auth_base_url+ '/channels/acceptChannelInvitation', 
          {
            //$FlowFixMe
            token: data.test1.token,
            msgId: msgs1[i].id,
          });
      }
    }
    for(let i = 0; i < msgs2.length; i ++) {
      if(msgs2[i].messageType === 'channelinvite'){
        //$FlowFixMe
        acceptInvite[msgs2[i].id] =  await frisby.post(data.auth_base_url+ '/channels/acceptChannelInvitation', 
          {
            //$FlowFixMe
            token: data.test2.token,
            msgId: msgs2[i].id,
          });
      }
    }

    for(let i = 0; i < msgs3.length; i ++) {
      if(msgs3[i].messageType === 'channelinvite'){
        //$FlowFixMe
        acceptInvite[msgs3[i].id] =  await frisby.post(data.auth_base_url+ '/channels/acceptChannelInvitation', 
          {
            //$FlowFixMe
            token: data.test3.token,
            msgId: msgs3[i].id,
          });
      }
    }

    await data.refreshTokens();

    // create challenges
    //env.AUTH_API_URL +'/channels/addNewSystemDoc'

    
    //test1 create challenges
    //$FlowFixMe
    const test1Ch1 = await frisby.post(data.auth_base_url+ '/channels/addNewSystemDoc', 
    {
      //$FlowFixMe
      token: data.test1.token,
      doctype: 'party',
      channelname: p1.json.channel,
      secondaryType: 'challenge',
      doc: {
        name: 'Daily Challenge',
        created: 1582962039624,
        updated: 1582962039624,
        type: "party",
        dirty: 0,
        rev: 1,
        access: "",
        secondaryType: "challenge",
        state: "waiting",
        difficulty: 4,
        regularityInterval: "week",
        regularityIntervalGoal: 3,
        regularityEachDayGoal: 1,
        members: []
      }
    });
    expect(test1Ch1.json.success).toBe(true);
    //$FlowFixMe
    const test1Ch2 = await frisby.post(data.auth_base_url+ '/channels/addNewSystemDoc', 
    {
      //$FlowFixMe
      token: data.test1.token,
      doctype: 'party',
      channelname: p1.json.channel,
      secondaryType: 'challenge',
      doc: {
        name: 'Daily Challenge',
        created: 1582962039624,
        updated: 1582962039624,
        type: "party",
        dirty: 0,
        rev: 1,
        access: "",
        secondaryType: "challenge",
        state: "waiting",
        difficulty: 1,
        regularityInterval: "day",
        regularityIntervalGoal: 1,
        regularityEachDayGoal: 1,
        members: []
      }
    });
    expect(test1Ch2.json.success).toBe(true);
    //$FlowFixMe
    const test1Ch3 = await frisby.post(data.auth_base_url+ '/channels/addNewSystemDoc', 
    {
      //$FlowFixMe
      token: data.test1.token,
      doctype: 'party',
      channelname: p1.json.channel,
      secondaryType: 'challenge',
      doc: {
        name: 'Monthly Challenge',
        created: 1582962039624,
        updated: 1582962039624,
        type: "party",
        dirty: 0,
        rev: 1,
        access: "",
        secondaryType: "challenge",
        state: "waiting",
        difficulty: 1,
        regularityInterval: "month",
        regularityIntervalGoal: 10,
        regularityEachDayGoal: 1,
        members: []
      }
    });
    expect(test1Ch3.json.success).toBe(true);

     //$FlowFixMe
     const test2Ch4 = await frisby.post(data.auth_base_url+ '/channels/addNewSystemDoc', 
     {
       //$FlowFixMe
       token: data.test2.token,
       doctype: 'party',
       channelname: p3.json.channel,
       secondaryType: 'challenge',
       doc: {
         name: 'Weekly Test 2 Challenge',
         created: 1582962039624,
         updated: 1582962039624,
         type: "party",
         dirty: 0,
         rev: 1,
         access: "",
         secondaryType: "challenge",
         state: "waiting",
         difficulty: 1,
         regularityInterval: "month",
         regularityIntervalGoal: 2,
         regularityEachDayGoal: 1,
         members: []
       }
     });
     expect(test2Ch4.json.success).toBe(true);


    //send requests to join
    
    //$FlowFixMe
    const test1AcCh1 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test1.token,
      challengeid: test1Ch1.json.doc.id
      
    });
    expect(test1AcCh1.json.success).toBe(true);
    //$FlowFixMe
    const test2AcCh1 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test1Ch1.json.doc.id
      
    });
    expect(test2AcCh1.json.success).toBe(true);
    //$FlowFixMe
    const test3AcCh1 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test3.token,
      challengeid: test1Ch1.json.doc.id
      
    });
    expect(test3AcCh1.json.success).toBe(true);
    //$FlowFixMe
    const test1AcCh2 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test1.token,
      challengeid: test1Ch2.json.doc.id
      
    });
    expect(test1AcCh2.json.success).toBe(true);
    //$FlowFixMe
    const test2AcCh2 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test1Ch2.json.doc.id
      
    });
    expect(test2AcCh2.json.success).toBe(true);
    //$FlowFixMe
    const test2AcCh3 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test1Ch3.json.doc.id
      
    });
    expect(test2AcCh3.json.success).toBe(true);
    //$FlowFixMe
    const test2AcCh4 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test2Ch4.json.doc.id
      
    });
    expect(test2AcCh4.json.success).toBe(true);
    //$FlowFixMe
    const test1AcCh4 = await frisby.post(data.auth_base_url+ '/habits/acceptChallenge', 
    {
      //$FlowFixMe
      token: data.test1.token,
      challengeid: test2Ch4.json.doc.id
      
    });
    expect(test1AcCh4.json.success).toBe(true);
    //start some challenges
     //$FlowFixMe
     const test1Ch1Start = await frisby.post(data.auth_base_url+ '/habits/changeChallengeState', 
     {
       //$FlowFixMe
       token: data.test1.token,
       challengeid: test1Ch1.json.doc.id,
       state:'current'
       
     });
     expect(test1Ch1Start.json.success).toBe(true);

     //$FlowFixMe
    const test1Ch2Start = await frisby.post(data.auth_base_url+ '/habits/changeChallengeState', 
    {
      //$FlowFixMe
      token: data.test1.token,
      challengeid: test1Ch2.json.doc.id,
      state:'current'
    });
    expect(test1Ch2Start.json.success).toBe(true);

    //$FlowFixMe
    const test2Ch4Start = await frisby.post(data.auth_base_url+ '/habits/changeChallengeState', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test2Ch4.json.doc.id,
      state:'current'
    });
    expect(test2Ch4Start.json.success).toBe(true);

    //add some actions
    //$FlowFixMe
    const test1Ch1Actions = await frisby.post(data.auth_base_url+ '/habits/submitChallengeActions', 
    {
      //$FlowFixMe
      token: data.test1.token,
      challengeid: test1Ch1.json.doc.id,
      actions: [
        {date: moment().subtract(1,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(2,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(3,'d').format(MOMENT_DATE_FORMAT), value: 1},
      ]
    });
    expect(test1Ch1Actions.json.success).toBe(true);

    //$FlowFixMe
    const test2Ch1Actions = await frisby.post(data.auth_base_url+ '/habits/submitChallengeActions', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test1Ch1.json.doc.id,
      actions: [
        {date: moment().subtract(0,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(1,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(2,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(3,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(8,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(9,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(10,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(11,'d').format(MOMENT_DATE_FORMAT), value: 1},
      ]
    });
    expect(test2Ch1Actions.json.success).toBe(true);


    //$FlowFixMe
    const test3Ch1Actions = await frisby.post(data.auth_base_url+ '/habits/submitChallengeActions', 
    {
      //$FlowFixMe
      token: data.test3.token,
      challengeid: test1Ch1.json.doc.id,
      actions: [
        {date: moment().subtract(1,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(2,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(3,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(8,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(9,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(10,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(11,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(18,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(19,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(21,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(22,'d').format(MOMENT_DATE_FORMAT), value: 1},
      ]
    });
    expect(test3Ch1Actions.json.success).toBe(true);



    //$FlowFixMe
    const test1Ch2Actions = await frisby.post(data.auth_base_url+ '/habits/submitChallengeActions', 
    {
      //$FlowFixMe
      token: data.test1.token,
      challengeid: test1Ch2.json.doc.id,
      actions: [
        {date: moment().subtract(1,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(2,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(3,'d').format(MOMENT_DATE_FORMAT), value: 1},
      ]
    });
    expect(test1Ch2Actions.json.success).toBe(true);

    //$FlowFixMe
    const test2Ch2Actions = await frisby.post(data.auth_base_url+ '/habits/submitChallengeActions', 
    {
      //$FlowFixMe
      token: data.test2.token,
      challengeid: test1Ch2.json.doc.id,
      actions: [
        {date: moment().subtract(1,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(2,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(3,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(4,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(5,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(6,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(7,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(8,'d').format(MOMENT_DATE_FORMAT), value: 1},
        {date: moment().subtract(9,'d').format(MOMENT_DATE_FORMAT), value: 1},
      ]
    });
    expect(test2Ch2Actions.json.success).toBe(true);


    //$FlowFixMe
    const test1Ch4Actions = await frisby.post(data.auth_base_url+ '/habits/submitChallengeActions', 
    {
       //$FlowFixMe
       token: data.test1.token,
       challengeid: test2Ch4.json.doc.id,
       actions: [
         {date: moment().subtract(1,'d').format(MOMENT_DATE_FORMAT), value: 1},
         {date: moment().subtract(2,'d').format(MOMENT_DATE_FORMAT), value: 1},
         {date: moment().subtract(3,'d').format(MOMENT_DATE_FORMAT), value: 1},
         {date: moment().subtract(4,'d').format(MOMENT_DATE_FORMAT), value: 1},
         {date: moment().subtract(5,'d').format(MOMENT_DATE_FORMAT), value: 1},
       ]
    });
    expect(test1Ch4Actions.json.success).toBe(true);





    console.log("Done");


}


module.exports = parties
