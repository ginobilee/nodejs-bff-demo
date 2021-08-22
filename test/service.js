import RPCServer from '../src/server.js';

const file = { test: 'testObject' };
const port = 5665;

const rpc = new RPCServer({
  // todo: 多个入参的处理
  combine: function (a, b) {
    return a + b
  },
  multiply: function (t) {
    return t * 2
  },
  longString: function () {
    // 构造一个 2m 的string
    let s = '1'
    const n2m = (2 << 20)
    for (let i = 0; i < n2m; i++) {
      s += '1'
    }
    s += 'over.'
    return s
  },
  getFile: function () {
    return file
  }
});

rpc.listen(port);
