const moment = require('moment');
const utilsGamify = require('../utilsGamification');
const FIRST_DAY_OF_WEEK = 'Monday';
const MOMENT_DATE_FORMAT = 'YYYYMMDD';

describe('CHALLENGE DAYS TEST', () => {
  
  
  it('Incorrect Action Dates ', async () => {

    const member =  {
      actions: {},
      lastCalculatedDate: moment().subtract(2, "day").format(MOMENT_DATE_FORMAT),
    };
  
    const channel = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'day',
      //regularityValue: 1,
      regularityEachDayGoal: 1,
    }

    const action = {date:moment().subtract(3, "day").format(MOMENT_DATE_FORMAT), value: 1};
    
    expect(() => {
      utilsGamify.calculateCurrentStreak(channel, member, [action]);
    }).toThrow()

    const action1 = {date:moment().add(1, "day").format(MOMENT_DATE_FORMAT), value: 1};
    
    expect(() => {
      const res = utilsGamify.calculateCurrentStreak(channel, member, [action1]);
    }).toThrow()

  });

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
      regularityInterval: 'day',
      //regularityValue: 1,
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
      regularityInterval: 'day',
      //regularityValue: 1,
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

  it('First Action - Multiple addon actions', async () => {

    const member =  {
      actions: {}
    };
  
    const channel = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'day',
      //regularityValue: 1,
      regularityEachDayGoal: 1,
    }

    const action1 = {date:moment().subtract(0, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action2 = {date:moment().subtract(1, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action3 = {date:moment().subtract(2, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action4 = {date:moment().subtract(5, "day").format(MOMENT_DATE_FORMAT), value: 1};

    const res = utilsGamify.calculateCurrentStreak(channel, member, 
        [action1, action2, action4, action3]);
    
    expect(res).not.toBeNull();
    expect(Object.keys(res.member.actions).length).toBe(4);
    expect(res.member.currentStreak).toBe(3);

  });

  it('Continued Action - Multiple addon actions', async () => {

    const member =  {
      actions: {
        [moment().subtract(3, "day").format(MOMENT_DATE_FORMAT)]:{
          value: 1, reward: { score: 0  }
        },
        [moment().subtract(4, "day").format(MOMENT_DATE_FORMAT)]:{
          value: 1, reward: { score: 0  }
        },
        [moment().subtract(8, "day").format(MOMENT_DATE_FORMAT)]:{
          value: 1, reward: { score: 0  }
        }
      }
    };
  
    const channel = {
      state: "current",
      difficulty: 2,
      regularityInterval: 'day',
      //regularityValue: 1,
      regularityEachDayGoal: 1,
    }

    const action1 = {date:moment().subtract(0, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action2 = {date:moment().subtract(1, "day").format(MOMENT_DATE_FORMAT), value: 1};
    const action3 = {date:moment().subtract(2, "day").format(MOMENT_DATE_FORMAT), value: 0};
    const action4 = {date:moment().subtract(5, "day").format(MOMENT_DATE_FORMAT), value: 1};

    const res = utilsGamify.calculateCurrentStreak(channel, member, 
        [action1, action2, action4, action3]);
    
    expect(res).not.toBeNull();
    expect(Object.keys(res.member.actions).length).toBe(7);
    expect(res.member.currentStreak).toBe(2);
    expect(res.member.biggestStreak).toBe(3);
  });


});

