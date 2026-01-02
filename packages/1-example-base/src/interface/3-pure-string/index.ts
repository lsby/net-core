import {
  GET参数解析插件,
  接口,
  接口逻辑,
  直接结果转换器,
  自定义结果返回器,
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
// - 如何返回纯字符串而不是 JSON 结构
// - 如何自定义返回头

let 接口路径 = '/api/pure-string' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new GET参数解析插件(z.object({ name: z.string() }))],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    // 参数.query 是类型安全的
    let { name } = 参数.query

    // 出错的时候要返回左值
    if (name === '') return new Left('名称不能为空' as const)

    return new Right({ data: `hello ${name}!` })
  },
)

// GET 参数也可以被计算
type _接口逻辑GET参数 = 计算接口逻辑GET参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

// 使用内置的 直接结果转换器 来转换数据
// 这要求 接口逻辑 返回右值时, 必须返回 { data: ... } 的形式
// 转换器会将 data 键对应的值直接作为转换结果, 适用于返回 xml, 二进制数据等场景
// 需要提供的参数:
// - 接口逻辑 的错误返回类型表示
// - 接口逻辑 的正确返回类型表示
// 转换器的逻辑是:
// - 如果是左值, 返回 { status: 'fail', data: ... }
// - 如果是右值, 返回 data 键对应的值
let 接口错误类型描述 = z.enum(['名称不能为空'])
let 接口正确类型描述 = z.object({ data: z.string() })
let 结果转换器 = new 直接结果转换器(接口错误类型描述, 接口正确类型描述)

export default new 接口(
  接口路径,
  接口方法,
  接口逻辑实现,
  结果转换器,
  // 这里使用内置的 自定义返回器 来设置返回头等信息
  // 自定义返回器将拿到原始的 req, res 句柄, 还会拿到 结果转换器 转换过的结果
  // 参数 转换结果 的类型会被自动推断
  new 自定义结果返回器((req, res, 转换结果) => {
    if (typeof 转换结果 === 'object') {
      res.send('出错')
      return
    }
    res.setHeader('Content-Type', 'text/plain')
    res.send(转换结果)
  }),
)
