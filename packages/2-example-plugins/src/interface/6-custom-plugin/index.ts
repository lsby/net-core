import { 常用结果转换器, 常用结果返回器, 接口, 接口逻辑, 插件 } from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 自定义插件示例
// =======================
// 除了内置的插件, 也可以编写自己的插件
// 这个例子展示了如何编写一个检查 请求头中的 Authorization 的插件

let 插件返回形状Zod = z.object({ headers: z.object({ authorization: z.string() }) })
class 请求头检查插件 extends 插件<typeof 插件返回形状Zod> {
  public constructor() {
    // 构造函数的参数:
    // - 第一个参数是zod实例, 描述该插件返回的形状
    // - 第二个参数是逻辑函数, 这个函数会获得原始的 req 和 res, 同时还会获得 请求附加参数
    super(插件返回形状Zod, async (req, _res, 请求附加参数) => {
      let log = 请求附加参数.log.extend('请求头检查插件')

      let auth = req.headers.authorization
      // 如果插件中抛出错误, 会返回兜底错误
      if (auth === void 0) throw new Error('缺少 Authorization 请求头')
      await log.debug('获取到 Authorization: %s', auth.substring(0, 20) + '...')

      return { headers: { authorization: auth } }
    })
  }
}

// 定义接口使用这个插件

let 接口路径 = '/api/plugins/custom' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造([new 请求头检查插件()], async (参数, 逻辑附加参数, 请求附加参数) => {
  let log = 请求附加参数.log

  // 参数中包含自定义插件提供的请求头信息
  let { authorization } = 参数.headers
  await log.info('获得 authorization: %s', authorization)

  if (authorization !== '123') {
    return new Left('鉴权失败' as const)
  }

  return new Right({})
})

let 结果转换器 = new 常用结果转换器(z.enum(['鉴权失败']), z.object({}))
let 结果返回器 = new 常用结果返回器()

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 结果转换器, 结果返回器)
