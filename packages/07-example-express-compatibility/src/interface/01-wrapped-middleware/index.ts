import { 常用接口返回器, 接口, 接口逻辑, 插件 } from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import express from 'express'
import { format } from 'node:util'
import { z } from 'zod'

// =======================
// express 中间件包装示例
// =======================
// 这个示例展示了:
// - 如何将 express 中间件包装为插件

// 我们先有一个express中间件
// 所谓中间件是指参数是(req, res, next)的函数
let json解析中间件 = express.json({})

// 继承`插件`抽象类, 写一个自己的类
let 错误类型描述 = z.object({ code: z.literal(400), data: z.string() })
export class 我的JSON解析插件<Result extends z.AnyZodObject> extends 插件<
  typeof 错误类型描述,
  z.ZodObject<{ body: Result }>
> {
  public constructor(t: Result) {
    // 构造函数的参数是:
    // - 错误类型zod对象
    // - 正确类型zod对象
    // - 逻辑实现函数
    super(错误类型描述, z.object({ body: t }), async (req, res, 附加参数) => {
      let log = 附加参数.log.extend(我的JSON解析插件.name)

      // express中间件通常会将数据挂在req上供下游使用
      // 这里, 我们写一个Promise阻塞协程运行, 在回调中调用中间件, 传入我们获得的req, res, 以及以及回调函数作为next
      // 回调函数中调用Promise的res, 让协程恢复运行
      // 最后await等待协程完成, 协程完成意味着中间件已经将数据挂在req上了
      // 虽然此时req已经被污染了, 但我们不会将req提供给业务逻辑, 所以还算可以接受(当然, 更好的办法是自己实现)
      await new Promise((pRes, _rej) => json解析中间件(req, res, () => pRes(null)))

      // 我们不会将req提供给业务逻辑, 于是我们将中间件挂上的东西拿出来
      // 在这里, 我们对其做一次zod验证, 以确保数据形状符合我们的描述
      let parseResult = t.safeParse(req.body)
      if (parseResult.success === false) {
        await log.error('解析 JSON 参数失败：%o', JSON.stringify(parseResult.error))
        return new Left({ code: 400, data: format('解析 JSON 失败: %o', JSON.stringify(parseResult.error)) })
      }

      await log.debug('成功解析 JSON 参数')
      return new Right({ body: parseResult.data })
    })
  }
}

let 接口路径 = '/api/calculate-add' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new 我的JSON解析插件(z.object({ a: z.number(), b: z.number() }))],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let { a, b } = 参数.body
    return new Right({ result: a + b })
  },
)

let 接口返回器 = new 常用接口返回器(z.never(), z.object({ result: z.number() }))
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
