import { 接口, 接口逻辑, 自定义接口返回器 } from '@lsby/net-core'
import { z } from 'zod'

// =======================
// express 原生使用
// =======================
// 这个示例展示了:
// - 如何直接使用 express 句柄编写接口

export default new 接口(
  '/api/raw-express',
  'get',
  接口逻辑.空逻辑(),
  new 自定义接口返回器(z.never(), z.object({}), z.any(), z.any(), (req, res) => {
    // 这里可以拿到原始的res/req, 可以做任何操作
    res.setHeader('Content-Type', 'text/plain')
    res.send('hello, world')
  }),
)
