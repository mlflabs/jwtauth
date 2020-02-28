const moment = require('moment');
const utilsGamify = require('../utilsGamification');
const FIRST_DAY_OF_WEEK = 'Monday';
const MOMENT_DATE_FORMAT = 'YYYYMMDD';

describe('CHALLENGE DAYS TEST', () => {

  it('First Action - Single', async () => {

    const member =  {
      actions: {
        [moment().subtract(5, "day").format(MOMENT_DATE_FORMAT)]:{
          value: 1, reward: { score: 0  }
        }
      }
    };
    const channel = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'week',
      regularityIntervalGoal: 2,
      regularityEachDayGoal: 1,
    }
    const action = {date:moment().subtract(0, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const res = utilsGamify.calculateCurrentStreak(channel, member, [action]);
    expect(res).not.toBeNull();
    
    expect(Object.keys(res.member.actions).length).toBe(2);
  });

  it('First Action - Single, Partial', async () => {

    const member =  {actions: {}};
    const member1 =  {actions: {}};
  
    const channel = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'week',
      regularityIntervalGoal: 1,
      regularityEachDayGoal: 2,
    }

    const action = {date:moment().subtract(0, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action1 = {date:moment().subtract(0, "day").format(MOMENT_DATE_FORMAT), value: 2};
    const res = utilsGamify.calculateCurrentStreak(channel, member, [action]);
    const res1 = utilsGamify.calculateCurrentStreak(channel, member1, [action1]);
    expect(res).not.toBeNull();
    expect(Object.keys(res.member.actions).length).toBe(1);
    expect(res.reward).toBeLessThan(res1.reward);
  });

  it('First Action - Multiple actions, same week', async () => {

    const member1 =  { actions: {} };
    const member2 =  { actions: {} };
    const member3=  { actions: {} };
    
    const channel = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'week',
      regularityIntervalGoal: 6,
      regularityEachDayGoal: 1,
    }

    const channel2 = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'week',
      regularityIntervalGoal:3,
      regularityEachDayGoal: 1,
    }

    //use a date 2 weeks ago, to make sure we don't go over current time period
    const firstDate = moment().day(FIRST_DAY_OF_WEEK).subtract(3, 'week');

    const action1 = {name: 1, date:firstDate.clone().subtract(3, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action2 = {name: 2, date:firstDate.clone().subtract(1, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action3 = {name: 3, date:firstDate.clone().subtract(2, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action4 = {name: 4, date:firstDate.clone().subtract(5, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action5 = {name: 5, date:firstDate.clone().add(0, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action6 = {name: 6, date:firstDate.clone().add(2, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action7 = {name: 7, date:firstDate.clone().add(3, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action8 = {name: 8, date:firstDate.clone().add(8, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action9 = {name: 9, date:firstDate.clone().add(4, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action10 = {name: 10, date:firstDate.clone().add(5, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action11 = {name: 11, date:firstDate.clone().add(6, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action12 = {name: 12, date:firstDate.clone().add(7, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action13 = {name: 13, date:firstDate.clone().add(9, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action14 = {name: 14, date:firstDate.clone().add(10, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action15 = {name: 14, date:firstDate.clone().add(15, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action16 = {name: 14, date:firstDate.clone().add(16, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action17 = {name: 14, date:firstDate.clone().add(17, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action18 = {name: 14, date:firstDate.clone().add(18, "day").format(MOMENT_DATE_FORMAT), value: 1};



    const res1 = utilsGamify.calculateCurrentStreak(channel, member1, 
        [action1, action2, action4, action3]);
    expect(res1).not.toBeNull();
    expect(Object.keys(res1.member.actions).length).toBe(4);
    expect(res1.member.currentStreak).toBe(4);
    expect(res1.member.biggestStreak).toBe(4);
    const lastDayRes1 = firstDate.clone().subtract(1, "day").format(MOMENT_DATE_FORMAT);
    //$FlowFixMe
    expect(member1.lastCalculatedDate).toEqual(lastDayRes1)
    const res2 = utilsGamify.calculateCurrentStreak(channel, member2, 
      [action1, action2, action4, action5, action6, action7]);
    const bestStreak = res2.member.bestStreak;
    expect(res2).not.toBeNull();
    expect(res2.member.currentStreak).toBe(3);
    expect(res2.member.biggestStreak).toBe(3);
    const res3 = utilsGamify.calculateCurrentStreak(channel, member2, 
      [ action8, action9, action10, action11, action12, action13, action14]);
    expect(res3).not.toBeNull();
    expect(res3.member.currentStreak).toBe(10);
    expect(res3.member.biggestStreak).toBe(10);
    const res4 = utilsGamify.calculateCurrentStreak(channel, member2, 
      [ action15, action16, action17, action18,]);
    expect(res4).not.toBeNull();
    expect(res4.member.currentStreak).toBe(4);
    expect(res4.member.biggestStreak).toBe(10);

    const res5 = utilsGamify.calculateCurrentStreak(channel2, member3, 
      [ action1, action2, action3, action4, action5, action6, action7, action8]);
    expect(res5).not.toBeNull();
    expect(res5.member.currentStreak).toBe(7);
    expect(res5.member.biggestStreak).toBe(7);
    expect(() => {
      utilsGamify.calculateCurrentStreak(channel2, member3, 
        [action9, action15]);
    }).toThrow();
    const res6 = utilsGamify.calculateCurrentStreak(channel2, member3, 
      [ action16, action17]);
    expect(res6).not.toBeNull();
    expect(res6.member.currentStreak).toBe(2);
    expect(res6.member.biggestStreak).toBe(7);


  });

});

