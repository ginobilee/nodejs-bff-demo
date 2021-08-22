import { log as defaultLogger, parseRpcResponse, buildDataBuffer } from './utils.js';
import net from 'net';

export default function RpcClient({ logger } = {}) {
  this.logger = logger || defaultLogger
}
const timeout = 10000
RpcClient.prototype.proxy = function proxy({
  host,
  port,
  fn,
  args,
} = {}) {
  const self = this
  return new Promise((resolve, reject) => {
    // 建立连接
    const connection = net.createConnection(port, host);

    let success = false
    // 远端数据的容器
    const lengthObj = {
      bufferBytes: undefined,
      getLength: true,
      length: -1
    }
    // 连接 rpc server
    connection.on('connect', function () {
      // 连接上后发送消息
      connection.write(buildClientRequestPayload(fn, args));
    })
    // 解析远端响应
    connection.on('data', function (data) {
      try {
        // 数据超出 socket 的一次消息长度后，将会分多次收到，这里会在一次通信中反复触发；所以用 finished 来标识此次通信是否结束，只有在结束后才返回
        // finished的判断标准是所有消息的长度，大于消息头部传来的长度字段值
        const [result, finished] = parseRpcResponse(data, lengthObj)
        if (finished) {
          self.logger.i('bff parsed data: ', result)
          success = true
          connection.end()
          resolve(getDataFromRpcResponse(result))
        }
      } catch (err) {
        self.logger.e('parse data error: ', err)
        resolve({ error: err, msg: 'parse data error.' })
      }
    })
    // 超时后不再等待
    connection.setTimeout(timeout);
    connection.on('timeout', () => {
      self.logger.i('connection timeout');
      if (!success) {
        resolve({ error: { timeout }, msg: 'rpc timeout.' })
      }
      connection.end();
    })
    connection.on('end', () => {
      self.logger.e('connection end.')
      // 可能会重复 resolve， 比如在触发 timeout 之后。但没有关系, promise 的状态是不会改变的
      if (!success) {
        resolve({ error: {}, msg: 'rpc end.' })
      }
    })
    connection.on('error', (err) => {
      this.logger.e('connection error: ', err)
      resolve({ error: err, msg: 'rpc connection error.' })
      connection.end()
    })
  })
}
function idGenerator(a) {
  return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).
    replace(/[018]/g, idGenerator);
};

function buildClientRequestPayload(fnName, args) {
  var id = idGenerator();
  const payload = { id: id, fn: fnName, args }

  return buildDataBuffer(payload)
}
function getDataFromRpcResponse(results) {
  // 如果有 data ，则直接返回；否则整体返回
  return results.map(r => r.data || r)
}
