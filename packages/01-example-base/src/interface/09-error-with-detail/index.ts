import { JSON参数解析插件, 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 带详情的错误示例接口
// =======================
// 这个示例展示了:
// - 如何返回一个带有"详情"的错误
// - 常用接口返回器会自动识别 `{ 错误: T; 详情?: string }` 的结构
//   并在返回客户端时，将其拼装到 detail 字段中

let 接口路径 = '/api/error-with-detail' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new JSON参数解析插件(z.object({ value: z.number() }), {})],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let { value } = 参数.json

    if (value < 0) {
      // 当发生错误时，不仅可以返回错误标识，还可以返回具体的错误详情
      return new Left({ 错误: '值不能为负数' as const, 详情: `传入的值为 ${value}, 期望一个大于等于0的值` })
    }

    return new Right({ result: value * 2 })
  },
)

let 接口错误类型描述 = z.enum(['值不能为负数'])
let 接口正确类型描述 = z.object({ result: z.number() })

let 接口返回器 = new 常用接口返回器(接口错误类型描述, 接口正确类型描述)

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
