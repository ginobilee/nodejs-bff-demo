import net from 'net';
import { buildDataBuffer, log as defaultLogger, parseRpcResponse } from './utils.js';

export default class LightRPCServer {
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

function fnExecution(fData, c, rpcInstance) {
  if (!rpcInstance.services[fData.fn]) {
    c.write(buildDataBuffer({ id: fData.id, error: { code: 'UNKNOWN_COMMAND' }, msg: '未找到对应的方法' }))
    return
  }

  const args = fData.args;
  try {
    const fn = rpcInstance.services[fData.fn]
    console.log('fdata: ', fData)
    const argList = Array.isArray(args) ? args : [args]
    const response = fn.apply({}, argList)
    c.write(buildDataBuffer({ id: fData.id, data: response }))
  }
  catch (err) {
    // log.e(err);

    c.write(buildDataBuffer({ id: fData.id, error: err }));
  }
};