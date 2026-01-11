import {
  UrlEncoded参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  计算接口逻辑UrlEncoded参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// UrlEncoded提交接口
// =======================
// 这个示例演示了:
// - 如何编写 POST 接口处理UrlEncoded数据
// - 如何使用 UrlEncoded 参数解析插件解析 application/x-www-form-urlencoded 数据
// - 如何验证 UrlEncoded 数据并返回错误
// - 如何返回 JSON 响应

let 接口路径 = '/api/form-submit' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new UrlEncoded参数解析插件(z.object({ username: z.string() }), {})],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let { username } = 参数.urlencoded

    // 模拟业务逻辑：检查用户名是否已存在
    if (username === 'admin') {
      return new Left('用户名已被占用' as const)
    }

    return new Right({ userId: 123, message: `hello ${username}` })
  },
)

// UrlEncoded参数也可以被计算
type _接口逻辑UrlEncoded参数 = 计算接口逻辑UrlEncoded参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

let 接口错误类型描述 = z.enum(['用户名已被占用'])
let 接口正确类型描述 = z.object({ userId: z.number(), message: z.string() })

let 接口返回器 = new 常用接口返回器(接口错误类型描述, 接口正确类型描述)

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
