import { GET参数解析插件, 常用结果转换器, 常用结果返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// GET 参数解析插件示例
// =======================
// GET参数解析插件用于解析 GET 请求的 URL 查询参数
// 例如：/api/plugins/get?keyword=hello&limit=10
// 验证失败时自动返回兜底错误, 在日志中打印具体信息

let 接口路径 = '/api/plugins/get' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    new GET参数解析插件(
      z.object({ keyword: z.string(), limit: z.coerce.number().default(10), offset: z.coerce.number().default(0) }),
    ),
  ],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let log = _请求附加参数.log

    let { keyword, limit, offset } = 参数.query
    await log.info('收到请求: keyword=%s, limit=%d, offset=%d', keyword, limit, offset)

    let 完整数据 = Array(10)
      .fill(null)
      .map((_, i) => i)
      .map((a) => ({ id: a, title: keyword + ` item ${a}` }))
    let 结果 = 完整数据.slice(offset, offset + limit)

    return new Right({ items: 结果, total: 完整数据.length, limit, offset })
  },
)

let 结果转换器 = new 常用结果转换器(
  z.never(),
  z.object({
    items: z.array(z.object({ id: z.number(), title: z.string() })),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
)
let 结果返回器 = new 常用结果返回器()

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 结果转换器, 结果返回器)
