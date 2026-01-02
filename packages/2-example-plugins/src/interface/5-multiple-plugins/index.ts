import { GET参数解析插件, JSON参数解析插件, 常用结果转换器, 常用结果返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 多插件组合示例
// =======================
//
// 实际应用中，一个接口往往需要多个插件
// 所有插件的结果会被深度合并，传入接口逻辑

let 接口路径 = '/api/plugins/multiple' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    new GET参数解析插件(z.object({ name: z.string().default('World') })),
    new JSON参数解析插件(z.object({ message: z.string() }), {}),
  ],
  async (参数, _逻辑附加参数, 请求附加参数) => {
    let log = 请求附加参数.log

    // 参数同时包含 query 和 body 两个字段
    let { name } = 参数.query
    let { message } = 参数.body

    await log.info('query.name=%s, body.message=%s', name, message)

    return new Right({ result: `Hello ${name}, Message: ${message}` })
  },
)

let 结果转换器 = new 常用结果转换器(z.never(), z.object({ result: z.string() }))
let 结果返回器 = new 常用结果返回器()

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 结果转换器, 结果返回器)
