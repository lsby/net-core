import { 常用接口返回器, 接口, 接口逻辑, 插件 } from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 自定义插件示例
// =======================
// 除了内置的插件, 也可以编写自己的插件
// 这个例子展示了, 如何编写检查请求头中的 Authorization 字段的插件

// =======================
// 理念
// =======================
// 插件的定位是, 从HTTP上下文中获得信息, 使后续逻辑能正确运行
// - 插件提供的信息是必要的, 如果插件无法获取到信息, 意味着接口逻辑不能正常运行
// - 插件提供错误处理能力, 可以在插件中返回左值来拒绝请求, 此时, 服务器会直接返回错误信息, 不会进入后续逻辑

let 插件返回形状Zod = z.object({ headers: z.object({ authorization: z.string() }) })
class 请求头检查插件 extends 插件<string, typeof 插件返回形状Zod> {
  public constructor() {
    // 构造函数的参数:
    // - 类型描述: 插件返回类型的描述
    // - 实现:
    //   - 一个函数, 参数是原始的req和res对象, 同时还会获得框架提供的"请求附加参数"
    //   - 应当在这个函数中从req中获取必要信息, 最终返回一个 Either, 这个对象会和其他插件的参数合并后提供给"业务逻辑"函数
    //   - 为了兼容express插件, 这里提供了res对象, 请勿使用res直接返回数据
    super(插件返回形状Zod, async (req, _res, 请求附加参数) => {
      let log = 请求附加参数.log.extend('请求头检查插件')

      let auth = req.headers.authorization
      // 如果校验失败, 返回左值
      if (auth === void 0) return new Left({ status: 401, data: '缺少 Authorization 请求头' })
      await log.debug('获取到 Authorization: %s', auth.substring(0, 20) + '...')

      return new Right({ headers: { authorization: auth } })
    })
  }
}

// 定义接口使用这个插件
let 接口路径 = '/api/plugins/custom' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造([new 请求头检查插件()], async (参数, 逻辑附加参数, 请求附加参数) => {
  let log = 请求附加参数.log

  // 一旦加入插件, 业务逻辑的"参数"中就会包含插件提供信息, 同时是类型安全的
  let { authorization } = 参数.headers
  await log.info('获得 authorization: %s', authorization)

  if (authorization !== '123') {
    return new Left('鉴权失败' as const)
  }

  return new Right({})
})

let 接口返回器 = new 常用接口返回器(z.enum(['鉴权失败']), z.object({}))

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
