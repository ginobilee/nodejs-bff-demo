export const log = {
  i: function () {
    var args = new Array(arguments.length);
    for (var ai = 0, al = arguments.length; ai < al; ++ai) {
      args[ai] = arguments[ai];
    }

    console.log(args);
  },
  e: function () {
    var args = new Array(arguments.length);
    for (var ai = 0, al = arguments.length; ai < al; ++ai) {
      args[ai] = arguments[ai];
    }

    console.error(args);
  },
};
export function encode(payload) {
  return JSON.stringify(payload)
}
export function decode(payload) {
  try {
    return JSON.parse(payload)
  } catch (err) {
    log.error('decode error: ', err)
    return { error: err }
  }
}
export function buildDataBuffer(payload) {
  const encoded = encode(payload)
  // 每个命令的开头(几个字节)，是消息的长度
  return Buffer.byteLength(encoded) + '\n' + encoded;
}

export function parseRpcResponse(data, lengthObj) {
  if (lengthObj.bufferBytes && lengthObj.bufferBytes.length > 0) {
    const tmpBuff = Buffer.alloc(lengthObj.bufferBytes.length + data.length);

    lengthObj.bufferBytes.copy(tmpBuff, 0);
    data.copy(tmpBuff, lengthObj.bufferBytes.length);

    lengthObj.bufferBytes = tmpBuff;
  } else {
    lengthObj.bufferBytes = data;
  }

  var [fnDatas, finished] = parseBufferDatas.call(lengthObj);
  return [fnDatas, finished]
}

export function clearBuffer(buffer, length) {
  if (buffer.length > length) {
    return buffer.slice(length);
  }

  return undefined;
}

const newLineCode = '\n'.charCodeAt(0);
export function getNewlineIndex(buffer) {
  if (buffer) {
    for (var i = 0, l = buffer.length; i < l; ++i) {
      if (buffer[i] === newLineCode) {
        return i;
      }
    }
  }

  return -1;
}
export function parseBufferDatas() {
  var datas = [];
  let finished = false;
  var i = -1;

  var parseBufferData = function () {
    if (this.getLength === true) {
      // 寻找 \n 前的长度标识
      i = getNewlineIndex(this.bufferBytes);
      if (i > -1) {
        this.length = Number(this.bufferBytes.slice(0, i).toString());
        this.getLength = false;
        this.bufferBytes = clearBuffer(this.bufferBytes, i + 1);
      }
    }

    // 当数据长度没有达到 length 时，不进行此步骤
    if (this.bufferBytes && this.bufferBytes.length >= this.length) {
      finished = true
      const dataStr = this.bufferBytes.slice(0, this.length).toString();
      // 处理完第一个data后，需要查看是否还有未解析完的数据继续解析
      this.getLength = true;

      let parsedData
      try {
        parsedData = decode(dataStr)
      }
      catch (e) {
        log.e('ERROR PARSE: ', e, dataStr);
        return;
      }

      datas.push(parsedData);
      // 将剩余部分放入缓存对象
      this.bufferBytes = clearBuffer(this.bufferBytes, this.length);

      // 继续处理下面的指令
      if (this.bufferBytes && this.bufferBytes.length > 0) {
        parseBufferData.call(this);
      }
    }
  };

  parseBufferData.call(this);
  return [datas, finished];
}