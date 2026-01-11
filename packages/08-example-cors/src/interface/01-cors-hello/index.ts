import { JSON参数解析插件, 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

let 接口路径 = '/api/cors/hello' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造([new JSON参数解析插件(z.object({ name: z.string() }), {})], async (参数) => {
  let { name } = 参数.json
  return new Right({ message: `Hello, ${name}! This request supports CORS.` })
})

let 接口返回器 = new 常用接口返回器(z.never(), z.object({ message: z.string() }), {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
