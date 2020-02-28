const frisby = require('frisby');
const data = require('./testDataValues')

const todos = async () => {
          //console.log(data);
          //$FlowFixMe
          let res = await frisby.post(data.auth_base_url+ '/sync/sync', {
          //$FlowFixMe
          token: data.test1.token,
          data: {
            channels: {
              //$FlowFixMe
              ['u'+data.test1.app+data.test1.id]: [
                {
                  done: false,
                  //$FlowFixMe
                  id: 'u'+data.test1.app+data.test1.id+ ".todo.tw1cb5o3",
                  created: 1582110379375,
                  updated: 1582110379375,
                  type: "todo",
                  dirty: 1,
                  name: "todo2",
                  date: null,
                  tags: ["tasks"],
                  subTodos: [],
                  showSubTodos: false,
                  showDone: false,
                  newRewards: {gold: 1, experience: 2, item: null},
                  doneRewards: {gold: 0, experience: 0},
                },
                {
                  done: false,
                  //$FlowFixMe
                  id: 'u'+data.test1.app+data.test1.id+ ".todo.tw1cb5o2",
                  created: 1582110379375,
                  updated: 1582110379375,
                  type: "todo",
                  dirty: 1,
                  name: "todo2",
                  date: null,
                  tags: ["tasks"],
                  subTodos: [],
                  showSubTodos: false,
                  showDone: false,
                  newRewards: {gold: 1, experience: 2, item: null},
                  doneRewards: {gold: 0, experience: 0},
                },
                {
                  done: false,
                  //$FlowFixMe
                  id: 'u'+data.test1.app+data.test1.id+ ".todo.tw1cb5o1",
                  created: 1582110379375,
                  updated: 1582110379375,
                  type: "todo",
                  dirty: 1,
                  name: "todo2",
                  date: null,
                  tags: ["tasks"],
                  subTodos: [],
                  showSubTodos: false,
                  showDone: false,
                  newRewards: {gold: 1, experience: 2, item: null},
                  doneRewards: {gold: 0, experience: 0},
                }
              ]
            },
            checkpoints: {
      
            }
          }
          })    
        expect(res.json.success).toBe(true);
        expect(res.status).toBe(200);

}

module.exports = todos;
