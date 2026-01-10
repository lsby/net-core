import { UrlEncoded参数解析插件, 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// UrlEncoded参数解析插件示例
// =======================
// 该插件用于解析请求的 application/x-www-form-urlencoded 格式的数据
// 这是 HTML 表单的默认提交格式
// 验证失败时自动返回兜底错误, 在日志中打印具体信息

let 接口路径 = '/api/plugins/form' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    new UrlEncoded参数解析插件(
      z.object({ username: z.string(), email: z.string().email(), age: z.coerce.number() }),
      {},
    ),
  ],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let { username, email, age } = 参数.urlencoded
    return new Right({ userId: 123, message: `欢迎 ${username}`, userInfo: { username, email, age } })
  },
)

let 接口返回器 = new 常用接口返回器(
  z.never(),
  z.object({
    userId: z.number(),
    message: z.string(),
    userInfo: z.object({ username: z.string(), email: z.string(), age: z.number() }),
  }),
)

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
