# nodejs-bff-demo

基于 Nodejs 的 BFF demo，主要描述了对于 rpc 通信的实现。

## 运行
``` bash
$ yarn # 安装依赖
$ yarn start:service # 启动 rpc 服务
$ yarn start:bff # 启动 bff 应用
```
之后，构造一个 post 请求，`body` 为 `{ fn: "multiply", args: 4 }` ，即可得到返回 `[8]`

## 解读
参考 []()

## 参考

 - [nodejs-light_rpc](https://github.com/romulka/nodejs-light_rpc)