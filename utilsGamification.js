import { MOMENT_DATE_FORMAT } from './models';
import moment, { Moment, months } from 'moment';
import { clamp } from '../../utils';

const FIRST_DAY_OF_WEEK = process.env.FIRST_DAY_OF_WEEK;
const utils = {};



utils.calculateCurrentStreak = (challenge, bufferSize = 0) => {
  console.log('calculateCurrentStreak:::: ', challenge, bufferSize);
  if(challenge.regularityInterval === 'day'){
    const h = calculateDailyChallengeStreak(challenge, bufferSize)
    return h;
  }

  if(challenge.regularityInterval === 'week'){
    return calculateHabitStreakByWeek(challenge, bufferSize);
  }

  if(challenge.regularityInterval === 'month'){
    return calculateHabitStreakByMonth(challenge, bufferSize);
  }

  return challenge;
}

const clamp = (val, max, min = 0) => {
  if(val > max) return max;
  if(val < min) return min;
  return val;
}

const getStreakByWeek = (challenge, weeksBack) => {
  const firstDay = moment().day(FIRST_DAY_OF_WEEK);
  let currentValue = 0;
  let streak = 0;
  if(!firstDay.isSame(moment(), 'day')){
    console.log('Not same day start');
    firstDay.add(1, 'week');
  }
  console.log(firstDay);
  //now we have the current first day of week, subtrack weeksBack
  firstDay.subtract(weeksBack, 'week');

  for(let i = 0; i < 7; i++) {
    currentValue = getProgressValueByDate(getProgressDate(firstDay,i), challenge);
    if(currentValue > 0) 
      streak++;
  }
  return streak;
}

const getStreakByMonth = (challenge, monthsBack) => {
  const firstDay = moment().date(1);
  
  if(!firstDay.isSame(moment(), 'day')){
    console.log('Not same day start');
    firstDay.add(1, 'month');
  }
  console.log(firstDay);
  let currentValue = 0;
  let streak = 0;
  firstDay.subtract(monthsBack, 'month');

  const currentDay = moment(firstDay);
  while(currentDay.isSame(firstDay, 'month')){
    currentValue = getProgressValueByDate(currentDay.format(MOMENT_DATE_FORMAT), challenge);
    if(currentValue > 0) 
      streak++;

    currentDay.add(1, 'day');
  }
  return streak;
}

const withinWeekBuffer = (buffer, offset) => {
  if(offset === 0) return true;

  const firstDay = moment().day(FIRST_DAY_OF_WEEK);
  if(!firstDay.isSame(moment(), 'day')){
    console.log('Not same day start');
    firstDay.add(1, 'week');
  }

  //now remove offset
  firstDay.subtract(offset, 'week');

  if(firstDay.isAfter(moment().subtract(buffer,'day'))) {
    return true;
  }
  
  return false;
}


const calculateHabitStreakByMonth = (challenge, bufferSize) => {
  console.log("Calculate Current Streak By Month: ", challenge);
  let streak = 0;
  let currentBiggestStreak = 0;
  let cont = true;
  let offset = 0;
  let currentValue = 0;
  while(cont) {
    currentValue = getStreakByMonth(challenge, offset);
    console.log('Month Streak: ', currentValue);
    console.log('--------------------Clamp:::: ', clamp(currentValue, challenge.regularityValue))
    streak += clamp(currentValue, challenge.regularityValue);
    if(streak > currentBiggestStreak) currentBiggestStreak = streak;

    if(currentValue < challenge.regularityValue && !withinWeekBuffer(bufferSize, offset)){
      cont = false;
    }
    //cont
    offset++;
  } 
  let bestStreak = challenge.bestStreak;
  if(!challenge.bestStreak)challenge.bestStreak = 0;
  if(currentBiggestStreak > challenge.bestStreak) bestStreak = currentBiggestStreak;
  return {...challenge, currentStreak: streak, bestStreak}
}


const calculateHabitStreakByWeek = (challenge, bufferSize) => {
  console.log("Calculate Current Streak By Week: ", challenge);
  let streak = 0;
  let currentBiggestStreak = 0;
  let cont = true;
  let offset = 0;
  let currentValue = 0;
  while(cont) {

    currentValue = getStreakByWeek(challenge, offset, FIRST_DAY_OF_WEEK);
    
    console.log('Week Streak: ', currentValue);
    console.log('--------------------Clamp:::: ', clamp(currentValue, challenge.regularityValue))
    streak += clamp(currentValue, challenge.regularityValue);
    if(streak > currentBiggestStreak) currentBiggestStreak = streak;


    if(currentValue >= challenge.regularityValue){
      
    }
    else {

      //do we still have buffer for this time period

      //streak = 0;
      //failed on this day,see if we are in the buffer
      
      if(withinWeekBuffer(bufferSize, offset)){
        console.log("We are within buffer, ", bufferSize, offset);
        //still have a chance
        
      }
      else {
        console.log("We are past buffer, ", bufferSize, offset);
        // did we success this time period

        //out of buffer, plus failed
        cont = false;
      }
    }
      
    //cont
    offset++;
  } 
  let bestStreak = challenge.bestStreak;
  if(!challenge.bestStreak)challenge.bestStreak = 0;
  if(currentBiggestStreak > challenge.bestStreak) bestStreak = currentBiggestStreak;
  return {...challenge, currentStreak: streak, bestStreak}
}



utils.calculateDailyHabitStreak = (challenge, bufferSize) => {
  console.log("Calculate Current Streak: ", challenge);
  let streak = 0;
  let currentBiggestStreak = 0;
  let cont = true;
  let offset = 0;
  let currentValue = 0;
  while(cont) {
    currentValue = getProgressValueByDate(getProgressDateBySubtract(offset), challenge);
    if(currentValue > 0){
      streak++
      if(streak > currentBiggestStreak) currentBiggestStreak = streak;
    }
    else {
      cont = false;
    }
      
    //cont
    offset++;
  } 
  let bestStreak = challenge.bestStreak;
  if(!challenge.bestStreak)challenge.bestStreak = 0;
  if(currentBiggestStreak > challenge.bestStreak) bestStreak = currentBiggestStreak;
  return {...challenge, currentStreak: streak, bestStreak}
}

const getProgressValueByDate = (date, challenge) => {
  if(!challenge.progress) challenge.progress = [];
  for(let i = 0; i < challenge.progress.length; i++){
    if(challenge.progress[i].date === date)
    {
      return challenge.progress[i].value;
    }
  }
  return 0;
}

const getProgressDateBySubtract = (subtract) => {
  return moment().subtract(subtract, 'day').format(MOMENT_DATE_FORMAT);
}

const getProgressDate = (date, subtract) => {
  return moment(date).subtract(subtract, 'd').format(MOMENT_DATE_FORMAT);
}