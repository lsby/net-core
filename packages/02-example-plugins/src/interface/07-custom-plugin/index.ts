import { 常用接口返回器, 接口, 接口逻辑, 自定义插件 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 自定义插件示例
// =======================
// 该示例展示如何使用自定义插件

let 接口路径 = '/api/plugins/custom' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    // 自定义插件可以直接提供插件的类型和逻辑:
    // - 错误类型描述: 错误类型的zod描述
    // - 正确类型描述: 正确类型的zod描述
    // - 实现: 插件的逻辑实现
    // 这其实是一种匿名的创建插件的方法
    new 自定义插件(
      z.object({ code: z.literal(400), data: z.string() }),
      z.object({ data: z.string() }),
      async (_req, _res, _请求附加参数) => {
        return new Right({ data: 'hello' })
      },
    ),
  ],
  async (参数, _逻辑附加参数, 请求附加参数) => {
    let log = 请求附加参数.log
    await log.info('data: %s', 参数.data)
    return new Right({})
  },
)

let 接口返回器 = new 常用接口返回器(z.never(), z.object({}))

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
