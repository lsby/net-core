import {
  JSON参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

let 接口路径 = '/api/calculate-add' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new JSON参数解析插件(z.object({ a: z.number(), b: z.number() }), {})],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let { a, b } = 参数.body
    return new Right({ result: a + b })
  },
)

type _接口逻辑JSON参数 = 计算接口逻辑JSON参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

let 接口返回器 = new 常用接口返回器(z.never(), z.object({ result: z.number() }))
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
