import express from 'express';
import bodyParser from 'body-parser';
import RpcClient from '../src/client.js';

const rpcClient = new RpcClient()
const app = express()
app.use(bodyParser.json());

app.post('/', async (req, res) => {
  const { fn, args } = req.body
  const response = await rpcClient.proxy({
    host: 'localhost',
    port: 5665,
    fn,
    args,
  })
  if (response.data) {
    res.send(response.data)
    return
  }
  res.send(response)
})

app.listen(3000, () => {
  console.info('listening on port 3000.')
})

