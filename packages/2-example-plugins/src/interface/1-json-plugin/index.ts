import { JSON参数解析插件, 常用结果转换器, 常用结果返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// JSON 参数解析插件示例
// =======================
// JSON参数解析插件用于解析 POST 请求的 JSON 请求体
// 这是最常用的插件，几乎所有的 JSON API 都需要它
// 验证失败时自动返回兜底错误, 在日志中打印具体信息

let 接口路径 = '/api/plugins/json' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new JSON参数解析插件(z.object({ x: z.number(), y: z.number() }), {})],
  async (参数, _逻辑附加参数, 请求附加参数) => {
    let log = 请求附加参数.log

    // 参数.body 是类型安全的
    let { x, y } = 参数.body
    await log.info('收到 JSON 请求: x=%d, y=%d', x, y)

    return new Right({ result: x + y })
  },
)

let 结果转换器 = new 常用结果转换器(z.never(), z.object({ result: z.number() }))
let 结果返回器 = new 常用结果返回器()

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 结果转换器, 结果返回器)
