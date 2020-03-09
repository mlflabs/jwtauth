
const moment  = require('moment');
const utils = require('./utils');
const channelDao = require('./channelDao');

const FIRST_DAY_OF_WEEK = process.env.FIRST_DAY_OF_WEEK || 'Monday';
const MOMENT_DATE_FORMAT = process.env.MOMENT_DATE_FORMAT || 'YYYYMMDD';
const GAMIFY_CHALLENGE_BASE_REWARD = parseInt(process.env.GAMIFY_CHALLENGE_BASE_REWARD||2);
const utilsGamify = {};

utilsGamify.test = () => {
  console.log('test');
}
const sortByDate = (a, b) =>{
  if(a.date > b.date) return 1;
  return -1;
}

// a is original, b is new
const mergeActions = (a, b) => {
  return {
    date: a.date,
    value: b.value, 
    reward: a.reward,
    data: b.data || a.data,
  }
}

utilsGamify.calculateCurrentStreak = (challenge, member, actions) => {
  
    //loop through actions and add up rewards
    let r;
    let res = {member, reward: 0, duplicate:{}};
    let sameDayAction;
    actions.sort(sortByDate).forEach(action => {
      //make sure we don't have future day, or past last calculated date day
      if(member.lastCalculatedDate){
        if(moment(action.date).isBefore(moment(member.lastCalculatedDate)))
          throw new Error('Action date is too old, can not modify this action');
        if(moment(action.date).isSame(moment(member.lastCalculatedDate)))
          sameDayAction = true;
      }
      if(moment(action.date).isAfter(moment()))
        throw new Error('Action date is in the future, cannot modify this action');
      
      if(challenge.regularityInterval === 'day')
        r = calculateDailyChallengeStreak(challenge,res.member,action, sameDayAction)
      else if(challenge.regularityInterval === 'week')
        r = calculateWeeklyChallengeStreak(challenge,res.member,action, sameDayAction)
      else if(challenge.regularityInterval === 'month')
        r = calculateMonthlyChallengeStreak(challenge,res.member,action, sameDayAction)
      else {
        throw new Error('Challenge has incorrect regularityInterval, ' + challenge.regularityInterval )
      }
      res.member = r.member;
      res.reward += r.reward;
      res.duplicate = {...res.duplicate, ...r.duplicate};
    });
    return res;
}

const clamp = (val, max, min = 0) => {
  if(val > max) return max;
  if(val < min) return min;
  return val;
}



//from action and back
const calculateDailyChallengeStreak = (challenge, member, action, sameDayAction) => {

  if(!member.lastCalculatedDate) {
    member.actions = {};
    member.lastCalculatedDate = moment(action.date).subtract(1,'d').format(MOMENT_DATE_FORMAT);
    member.biggestStreak = 0;
    member.currentStreak = 0;
  }
  if(sameDayAction){
    member.actions[action.date] = mergeActions(member.actions[action.date], action)
  }
  else {
    member.actions[action.date] = action;
    member.actions[action.date].reward = {value: 0};
  }
  

  let currentAction = null;
  let currentDateMoment = moment(member.lastCalculatedDate).add(1, 'd');

  //run this after going action/lastcalculateddate logic
  while(currentDateMoment.isSameOrBefore(moment(action.date))) {
    currentAction = member.actions[currentDateMoment.format(MOMENT_DATE_FORMAT)];

    //see if its null, no action or if contains values
    if(currentAction) {
      //do we have a value
      if(currentAction.value >= challenge.regularityEachDayGoal){
        //success
        member.currentStreak++;
      }
      else {
        //we have an action, but not a success
        member.currentStreak = 0;
      }
    }
    else {
        //currentAction is null, failed
        member.currentStreak = 0;
    }
    if(member.currentStreak > member.biggestStreak)
      member.biggestStreak = member.currentStreak;

    currentDateMoment.add(1, 'day');
  }

  //calculate rewards
  let reward;
  if(member.currentStreak === 0){
    reward = Math.floor(GAMIFY_CHALLENGE_BASE_REWARD * 
                        (action.value / challenge.regularityEachDayGoal));
  }
  else {
    reward = calculateRewardsByStreakSize(member.currentStreak, 
                                          challenge.difficulty,
                                          GAMIFY_CHALLENGE_BASE_REWARD);
  }

  member.lastCalculatedDate = action.date;
  
  const duplicate = {
    [action.date]: {value: member.actions[action.date].reward.value, sameDayAction}
  }
  member.actions[action.date].reward = {value: reward};
  return {member, reward, duplicate};
}



//this function modifies member variable
const analizeDay = (currentAction, member, challenge) => {
   //see if its null, no action or if contains values
   let reward = 0;
   if(currentAction) {
    //do we have a value
    if(currentAction.value >= challenge.regularityEachDayGoal){
      //success
      if(member.currentTimeperiedStreak < challenge.regularityIntervalGoal){
        member.currentTimeperiedStreak++;
        member.currentStreak++;
        reward = calculateRewardsByStreakSize(member.currentStreak, 
                                              challenge.difficulty,
                                              GAMIFY_CHALLENGE_BASE_REWARD);
      }
      else
      {
        //we made it, but we are over the goal value, just give basic bonus
        //make it half of even a non streak one
        member.currentTimeperiedStreak++; //to see when we have a duplicate action sumbited
                                          //if we need to remove one from this, or just keep going
        reward = Math.floor(GAMIFY_CHALLENGE_BASE_REWARD/2);
      }
    } 
    else {
      //we didn't make it this day, just give a basic, fraction of base reward
      reward = Math.floor(GAMIFY_CHALLENGE_BASE_REWARD * 
        (currentAction.value / challenge.regularityEachDayGoal));
    }
  }
   
  if(member.currentStreak > member.biggestStreak)
    member.biggestStreak = member.currentStreak;
  
  return reward;
}

//from action and back
const calculateMonthlyChallengeStreak = (challenge, member, action, sameDayAction) => {
  if(!member.lastCalculatedDate) {
    member.actions = {};
    member.lastCalculatedDate = moment(action.date).subtract(1,'d').format(MOMENT_DATE_FORMAT);
    member.biggestStreak = 0;
    member.currentStreak = 0;
    member.currentTimeperiedStreak = 0;
    member.currentTimeperiodLastDay = moment(member.lastCalculatedDate).date(1)
                                        .add(1, 'month').format(MOMENT_DATE_FORMAT);
  }

  let preAction = {reward:{value:0}, value:0, date:null};
  if(sameDayAction){
    preAction= Object.assign(member.actions[action.date]);
    member.actions[action.date] = mergeActions(member.actions[action.date], action)
  }
  else {
    member.actions[action.date] = action;
    member.actions[action.date].reward = 0;
  }

  let currentAction = member.actions[action.date]
  const currentActionDate = moment(action.date);
  let nextTimeperiodFirstDay = moment(member.currentTimeperiodLastDay);
  let reward = 0
  //run this after going action/lastcalculateddate logic

 
  if(moment(member.lastCalculatedDate).isBefore(currentActionDate)) {
    
    //are we in the same week
    if(currentActionDate.isBefore(nextTimeperiodFirstDay)) {
      reward = analizeDay(currentAction, member, challenge)
    }
    else{ 
      //starting new timeperiod
      //see if we made it last period
      if(member.currentTimeperiedStreak < challenge.regularityIntervalGoal){
        //we didn't make it, clear the streak
        member.currentStreak = 0;
      }
      nextTimeperiodFirstDay.add(1, 'month');
      member.currentTimeperiodLastDay = nextTimeperiodFirstDay.format(MOMENT_DATE_FORMAT);
      //if we are before action date, its an error, too big of time span
      if(currentActionDate.isAfter(nextTimeperiodFirstDay)){
        throw new Error('Action dates are too much apart.');
      }
      member.currentTimeperiedStreak = 0;
      reward = analizeDay(currentAction, member, challenge);
    }
    member.lastCalculatedDate = action.date;  
  }
  else {
    const previousMonth = nextTimeperiodFirstDay.clone().subtract(1, 'month')

    if(currentActionDate.isBefore(previousMonth)) 
      throw new Error('This action belongs to previous month and action on' +
       ' this date has already been submited, this is not allowed, sorry.');
    
    if(preAction.value < challenge.regularityEachDayGoal){
        reward = analizeDay(currentAction, member, challenge);
    }
    else {
      if(member.currentTimeperiedStreak <= challenge.regularityIntervalGoal)
        member.currentStreak--;
  
      member.currentTimeperiedStreak--;
      reward = analizeDay(currentAction, member, challenge);
    }
  }

  

  const duplicate = {
    [action.date]: {value: preAction.reward.value, sameDayAction}
  }
  member.actions[action.date].reward = {value: reward};
  return {member, reward, duplicate};
}



const calculateWeeklyChallengeStreak = (challenge, member, action, sameDayAction) => {
  if(!member.lastCalculatedDate) {
    member.lastCalculatedDate = moment(action.date).subtract(1,'d').format(MOMENT_DATE_FORMAT);
    member.biggestStreak = 0;
    member.currentStreak = 0;
    member.currentTimeperiedStreak = 0;
    member.currentTimeperiodLastDay = moment(member.lastCalculatedDate).day(FIRST_DAY_OF_WEEK)
                                          .add(1, 'week').format(MOMENT_DATE_FORMAT);
    member.actions = {};
  }

  //use at bottom of function, for duplicate dates
  let preAction = {reward:{value:0}, value:0, date:null};
  if(sameDayAction){
    preAction= Object.assign(member.actions[action.date]);
    member.actions[action.date] = mergeActions(member.actions[action.date], action)
  }
  else {
    member.actions[action.date] = action;
    member.actions[action.date].reward = 0;
  }
  

  let nextWeekFirstDay = moment(member.currentTimeperiodLastDay);
  //see if its a duplicate date

  let reward = 0
  const currentAction = member.actions[action.date];
  const currentActionDate = moment(action.date);
  //run this after going action/lastcalculateddate logic
  //run only if its a future date
  if(moment(member.lastCalculatedDate).isBefore(currentActionDate)){
        

        //are we in the same week
        if(currentActionDate.isBefore(nextWeekFirstDay)) {
          reward = analizeDay(currentAction, member, challenge)
        }
        else{ 
          //starting new timeperiod
          //see if we made it last period
          if(member.currentTimeperiedStreak < challenge.regularityIntervalGoal){
            //we didn't make it, clear the streak
            member.currentStreak = 0;
          }
          nextWeekFirstDay.add(1, 'week');
          member.currentTimeperiodLastDay = nextWeekFirstDay.format(MOMENT_DATE_FORMAT);
          //if we are before action date, its an error, too big of time span
          if(currentActionDate.isAfter(nextWeekFirstDay)){
            throw new Error('Action dates are too much apart.');
          }
          member.currentTimeperiedStreak = 0;
          reward = analizeDay(currentAction, member, challenge);
        }

      //at the end of the while statement, we need to update, last calculated date
      //we don't want this at the end, since this will include duplicate dates
      member.lastCalculatedDate = action.date;
  }
  else {
    //duplicate date
    //get old action
    
    //did we do it, or was it a non complete, this will affect our numbers
    //also we can't have a dupicate in previous time period, test for it
    //subtract one week from current week 
    const previousWeek = nextWeekFirstDay.clone().subtract(1, 'week')
    //date has been loaded from previous action
    if(currentActionDate.isBefore(previousWeek)) 
      throw new Error('This action belongs to previous week and action on' +
       ' this date has already been submited, this is not allowed, sorry.');

    //we are in current time period, see if this action was not completed
    //value has been loaded from previous action
    if(preAction.value < challenge.regularityEachDayGoal){
      //just analize the new value normally, since no streaks have been added previously
      reward = analizeDay(currentAction, member, challenge);
    }
    else {
      //also check if we went over the regularityGoal, if so no need to take one out, since
      //we didn't add it last time
      //remove one from streak and continue noramlly
      if(member.currentTimeperiedStreak <= challenge.regularityIntervalGoal)
        member.currentStreak--;

      member.currentTimeperiedStreak--;
      reward = analizeDay(currentAction, member, challenge);
    }
  }

  const duplicate = {
    [action.date]: {value: preAction.reward.value, sameDayAction}
  }
  member.actions[action.date].reward = {value: reward};
  return {member, reward, duplicate};
}

const calculateRewardsByStreakSize = (streak, difficulty,  baseXP) => {
  let exponent = 0.7 + difficulty/5;
  return Math.floor(baseXP + (streak * exponent))
  
}
utilsGamify.calculateRewardsByStreakSize = calculateRewardsByStreakSize;




const sendActionSubmitMessage =  async (channel, challenge, user, date, data, duplicate, apiddb) => {
  try {
    const challengeUuid = challenge.id.split('.')[3];
    const id = channel+'.msg.'+challengeUuid+'.'+user.id+'.'+date;
    const timestamp = Date.now();
    let doc = {
      _id: id,
      created: timestamp,
      updated: timestamp,
      type: process.env.DOC_TYPE_MSG,
      channel,
      username: user.username,
      challengeName: challenge.name,
      data, 
      messageType:'action',
      messageSubType:challenge.challengeType
    }
    if(duplicate){
      const oldDoc = await channelDao.getDoc(id, apiddb);
      if(oldDoc){
        doc._rev = oldDoc._rev;
      }
    }
    await channelDao.saveDoc(doc, apiddb);
  }
  catch(e) {
    console.log(e);
    return false;
  }
}



const createMessages = async (gamifyRes, challenge, userid, apidb) => {
  console.log(gamifyRes);
  const keys = Object.keys(gamifyRes.duplicate);
  const channel = utils.getChannelFromChannelDocId(challenge.id);

  for(let i = 0; i < keys.length; i ++) {
    //is the message duplicate
    if(challenge.challengeType === 'Note'){
      const data = gamifyRes.member.actions[keys[i]].data;
      await sendActionSubmitMessage(channel, challenge, userid, keys[i], data, 
        gamifyRes.duplicate[keys[i]].sameDayAction, apidb)
        
    }
  }
}
utilsGamify.createMessages = createMessages;
























module.exports = utilsGamify;