import {
  GET参数解析插件,
  接口,
  接口逻辑,
  自定义接口返回器,
  计算接口逻辑GET参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 纯字符串接口
// =======================
// 这个示例演示了:
// - 如何编写 GET 接口
// - 如何表示接口出错
// - 如何使用自定义接口返回器
// - 如何返回纯字符串而不是 JSON 结构
// - 如何自定义返回头

let 接口路径 = '/api/pure-string' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new GET参数解析插件(z.object({ name: z.string() }))],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    // 参数.query 是类型安全的
    let { name } = 参数.query

    // 出错时要返回左值
    if (name === '') return new Left('名称不能为空' as const)

    // 正常时应返回右值
    return new Right({ data: `hello ${name}!` })
  },
)

// GET 参数也可以被计算
type _接口逻辑GET参数 = 计算接口逻辑GET参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

// 接口逻辑的错误值, 正确值定义
let 接口错误类型描述 = z.enum(['名称不能为空'])
let 接口正确类型描述 = z.object({ data: z.string() })

export default new 接口(
  接口路径,
  接口方法,
  接口逻辑实现,
  // 本例中, 使用"自定义接口返回器", 它的参数是:
  // - 实现错误类型Zod: "接口逻辑"错误时的类型描述
  // - 实现正确类型Zod: "接口逻辑"正确时的类型描述
  // - 接口错误类型Zod: "接口"预期的错误返回类型描述(用于生成类型文件)
  // - 接口正确类型Zod: "接口"预期的正确返回类型描述(用于生成类型文件)
  // - 实现函数: 返回器的核心逻辑, 可以拿到原始的 req, res, 和"逻辑实现"返回的Either数据
  // 事实上, "常用接口返回器"只是一个"自定义接口返回器"的特化形式
  new 自定义接口返回器(接口错误类型描述, 接口正确类型描述, z.string(), z.string(), (req, res, data) => {
    if (data.isLeft() === true) return res.send(data.assertLeft().getLeft())
    res.setHeader('Content-Type', 'text/plain')
    return res.send(data.assertRight().getRight())
  }),
)
