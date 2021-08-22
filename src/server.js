import net from 'net';
import { buildDataBuffer, log as defaultLogger, parseRpcResponse } from './utils.js';

export default class RPCServer {
  constructor(services, logger) {
    // super(services, logger)
    this.logger = logger || defaultLogger;
    this.services = services;
    this.listen = (port) => {
      this.getServer();
      this.server.listen(port, () => {
        this.logger.i(`server running on port ${port}`)
      });
    }
    this.getServer = function () {
      const self = this;
      const server = net.createServer(function (c) {
        // 用来存储要进行解析的数据
        const lengthObj = {
          bufferBytes: undefined,
          getLength: true,
          length: -1
        };

        c.on('data', getOnDataFn(c, lengthObj, self));
      });

      this.server = server;
    }
    this.close = () => {
      this.server.close();
    }
  }
}

function getOnDataFn(connection, lengthObj, rpcInstance) {
  return function (data) {
    const [fnDatas, finished] = parseRpcResponse(data, lengthObj)
    if (finished) {
      fnDatas.forEach(fData => fnExecution(fData, connection, rpcInstance));
    }
  };
}

function fnExecution(reqData, c, rpcInstance) {
  if (!rpcInstance.services[reqData.fn]) {
    c.write(buildResponse({ reqData, msg: '未找到对应的方法', error: { code: 'UNKNOWN_COMMAND' } }))
    return
  }

  const args = reqData.args;
  try {
    const fn = rpcInstance.services[reqData.fn]
    const argList = Array.isArray(args) ? args : [args]
    const data = fn.apply({}, argList)
    c.write(buildResponse({ reqData, data }))
  }
  catch (error) {
    // log.e(err);
    c.write(buildResponse({ reqData, error, msg: '执行方法错误' }));
  }
};
/**
 * 
 * @param {*} oPayload 格式如下
 * {
 *   reqData: { id: 'x', fn: 'fnname', args: [] } 请求
 *   data: 方法执行结果
 *   msg: 错误描述
 *   error: 错误信息
 * }
 */
function buildResponse(oPayload) {
  const responsePayload = { id: oPayload.reqData.id, ...oPayload }
  delete responsePayload.reqData
  return buildDataBuffer(responsePayload)
}