
const moment  = require('moment');

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

utilsGamify.calculateCurrentStreak = (challenge, member, actions) => {
  
    //loop through actions and add up rewards
    let r;
    let res = {member, reward: 0};
    actions.sort(sortByDate).forEach(action => {
      //make sure we don't have future day, or past last calculated date day
      if(member.lastCalculatedDate){
        if(moment(action.date).isBefore(moment(member.lastCalculatedDate)))
          throw new Error('Action date is too old, can not modify this action');
        if(moment(action.date).isSame(moment(member.lastCalculatedDate)))
          throw new Error('Action for this date already submitted.');
      }
      if(moment(action.date).isAfter(moment()))
        throw new Error('Action date is in the future, cannot modify this action');
      
      if(challenge.regularityInterval === 'day')
        r = calculateDailyChallengeStreak(challenge,res.member,action)
      else if(challenge.regularityInterval === 'week')
        r = calculateWeeklyChallengeStreak(challenge,res.member,action)
      else if(challenge.regularityInterval === 'month')
        r = calculateMonthlyChallengeStreak(challenge,res.member,action)
      else {
        throw new Error('Challenge has incorrect regularityInterval, ' + challenge.regularityInterval )
      }
      res.member = r.member;
      res.reward += r.reward;
      
    });
    return res;
}

const clamp = (val, max, min = 0) => {
  if(val > max) return max;
  if(val < min) return min;
  return val;
}



//from action and back
const calculateDailyChallengeStreak = (challenge, member, action) => {
  

  if(!member.lastCalculatedDate) {
    member.actions = {};
    member.lastCalculatedDate = moment(action.date).subtract(1,'d').format(MOMENT_DATE_FORMAT);
    member.biggestStreak = 0;
    member.currentStreak = 0;
  }
  member.actions[action.date] = {value: action.value};

  let currentAction = null;
  let currentDateMoment = moment(member.lastCalculatedDate).add(1, 'd');

  //run this after going action/lastcalculateddate logic
  let tt = currentDateMoment.format(MOMENT_DATE_FORMAT);
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
    tt = currentDateMoment.format(MOMENT_DATE_FORMAT);
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

  return {member, reward};
}



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
const calculateMonthlyChallengeStreak = (challenge, member, action) => {
  if(!member.lastCalculatedDate) {
    member.actions = {};
    member.lastCalculatedDate = moment(action.date).subtract(1,'d').format(MOMENT_DATE_FORMAT);
    member.biggestStreak = 0;
    member.currentStreak = 0;
    member.currentTimeperiedStreak = 0;
    member.currentTimeperiodLastDay = moment(member.lastCalculatedDate).date(1)
                                        .add(1, 'month').format(MOMENT_DATE_FORMAT);
  }

  member.actions[action.date] = {value: action.value};

  let currentAction = null;

  let nextTimeperiodFirstDay = moment(member.currentTimeperiodLastDay);
  let currentDateMoment = moment(member.lastCalculatedDate).add(1, 'd');
  let reward = 0
  //run this after going action/lastcalculateddate logic
  while(currentDateMoment.isSameOrBefore(moment(action.date))) {
    currentAction = member.actions[currentDateMoment.format(MOMENT_DATE_FORMAT)];

    //are we in the same week
    if(currentDateMoment.isBefore(nextTimeperiodFirstDay)) {
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
      if(currentDateMoment.isAfter(nextTimeperiodFirstDay)){
        throw new Error('Action dates are too much apart.');
      }
      member.currentTimeperiedStreak = 0;
      reward = analizeDay(currentAction, member, challenge);
    }
    currentDateMoment.add(1, 'day');
  }

  member.lastCalculatedDate = action.date;
  return {member, reward};
}



const calculateWeeklyChallengeStreak = (challenge, member, action) => {
  if(!member.lastCalculatedDate) {
    member.lastCalculatedDate = moment(action.date).subtract(1,'d').format(MOMENT_DATE_FORMAT);
    member.biggestStreak = 0;
    member.currentStreak = 0;
    member.currentTimeperiedStreak = 0;
    member.currentTimeperiodLastDay = moment(member.lastCalculatedDate).day(FIRST_DAY_OF_WEEK)
                                          .add(1, 'week').format(MOMENT_DATE_FORMAT);
                            ;
    member.actions = {};
  }

  member.actions[action.date] = {value: action.value};

  let currentAction = null;

  let nextWeekFirstDay = moment(member.currentTimeperiodLastDay);
  let currentDateMoment = moment(member.lastCalculatedDate).add(1, 'd');
  let reward = 0
  //run this after going action/lastcalculateddate logic
  while(currentDateMoment.isSameOrBefore(moment(action.date))) {
    currentAction = member.actions[currentDateMoment.format(MOMENT_DATE_FORMAT)];

    //are we in the same week
    if(currentDateMoment.isBefore(nextWeekFirstDay)) {
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
      if(currentDateMoment.isAfter(nextWeekFirstDay)){
        throw new Error('Action dates are too much apart.');
      }
      member.currentTimeperiedStreak = 0;
      reward = analizeDay(currentAction, member, challenge);
    }
    currentDateMoment.add(1, 'day');
  }

  member.lastCalculatedDate = action.date;
  return {member, reward};
}

const calculateRewardsByStreakSize = (streak, difficulty,  baseXP) => {
  let exponent = 0.7 + difficulty/5;
  return Math.floor(baseXP + (streak * exponent))
  
}
utilsGamify.calculateRewardsByStreakSize = calculateRewardsByStreakSize;



module.exports = utilsGamify;