import { JSON参数解析插件, 合并插件结果, 接口逻辑, 接口逻辑附加参数类型, 请求附加参数类型 } from '@lsby/net-core'
import { Either, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

type 返回类型<结果类型Zod extends z.AnyZodObject> = {
  设置缓存: (数据: z.infer<结果类型Zod>) => void
  缓存数据: z.infer<结果类型Zod> | null
}

// 这是一个通用的缓存接口逻辑, 写的很简单, 仅作为教学
// 和普通的接口逻辑本质上没有任何不同, 完全可以自己设计
// 为了通用, 将类型等信息也作为参数传入, 所以比较复杂

export class 缓存逻辑<输入类型Zod extends z.AnyZodObject, 结果类型Zod extends z.AnyZodObject> extends 接口逻辑<
  [JSON参数解析插件<输入类型Zod>],
  接口逻辑附加参数类型,
  never,
  返回类型<结果类型Zod>
> {
  private 缓存池 = new Map<string, { 数据: z.infer<结果类型Zod>; 过期时间: number }>()

  public constructor(
    private 输入类型Zod: 输入类型Zod,
    private 结果类型Zod: 结果类型Zod,
    private 缓存TTL: number = 10 * 60 * 1000,
  ) {
    super()
  }

  public override 获得插件们(): [JSON参数解析插件<输入类型Zod>] {
    return [new JSON参数解析插件(this.输入类型Zod, {})]
  }

  public override async 实现(
    参数: 合并插件结果<[JSON参数解析插件<输入类型Zod>]>,
    _逻辑附加参数: 接口逻辑附加参数类型,
    请求附加参数: 请求附加参数类型,
  ): Promise<Either<never, 返回类型<结果类型Zod>>> {
    let log = 请求附加参数.log.extend('缓存逻辑')

    await log.info('开始缓存逻辑处理')

    let 缓存键 = JSON.stringify(参数.body)

    await log.debug(`缓存键: ${缓存键}`)

    let 设置缓存 = (数据: z.infer<结果类型Zod>): void => {
      // 计算过期时间：当前时间 + TTL
      let 过期时间 = this.缓存TTL === 0 ? Infinity : Date.now() + this.缓存TTL
      this.缓存池.set(缓存键, { 数据, 过期时间 })
    }

    let body = 参数.body
    if (body === void 0) {
      await log.info('请求体为空，返回空缓存')
      return new Right({ 设置缓存, 缓存数据: null })
    }

    // 检查缓存是否存在
    let 缓存项 = this.缓存池.get(缓存键)
    if (缓存项 === void 0) {
      await log.info('缓存未命中')
      return new Right({ 设置缓存, 缓存数据: null })
    }

    // 检查缓存是否过期
    let 当前时间 = Date.now()
    if (当前时间 >= 缓存项.过期时间) {
      // 缓存已过期，删除它
      await log.info('缓存已过期，删除缓存')
      this.缓存池.delete(缓存键)
      return new Right({ 设置缓存, 缓存数据: null })
    }

    // 缓存未过期，返回缓存数据
    await log.info('缓存命中，返回缓存数据')
    return new Right({ 设置缓存, 缓存数据: 缓存项.数据 })
  }
}
