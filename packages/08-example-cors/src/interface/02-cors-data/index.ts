import { 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

let 接口路径 = '/api/cors/data' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造([], async () => {
  return new Right({
    status: 'success',
    data: {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ],
      timestamp: new Date().toISOString(),
    },
  })
})

let 接口返回器 = new 常用接口返回器(
  z.never(),
  z.object({
    status: z.string(),
    data: z.object({ items: z.array(z.object({ id: z.number(), name: z.string() })), timestamp: z.string() }),
  }),
  {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
)

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
