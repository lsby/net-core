import type { Request, Response } from 'express'
import { Either } from '@lsby/ts-fp-data'
import { Global } from '../global/global'
import { 合并插件结果, 插件附加参数, 插件项类型 } from '../plugin/plug'

type 计算混合单一组合<A, B> =
  A extends 接口逻辑<infer A插件类型, infer A附加参数, infer A错误, infer A返回>
    ? B extends 接口逻辑<infer B插件类型, infer B附加参数, infer B错误, infer B返回>
      ? 接口逻辑<[...A插件类型, ...B插件类型], A附加参数 & Omit<B附加参数, keyof A返回>, A错误 | B错误, A返回 & B返回>
      : never
    : never
type 计算混合组合数组<Arr> = Arr extends [infer x]
  ? x
  : Arr extends [infer x, infer y]
    ? 计算混合单一组合<x, y>
    : Arr extends [infer x, infer y, ...infer s]
      ? 计算混合组合数组<[计算混合单一组合<x, y>, ...s]>
      : never

export type 接口逻辑错误类型 = string | never
export type 接口逻辑正确类型 = Record<string, any>
export type 接口逻辑附加参数类型 = Record<string, any>

/**
 * 接口逻辑的实际承担者.
 *
 * - 会被"服务器"调用, 调用时, 注入该实例的插件可以获得req和res.
 * - 插件将获取上下文的数据, 返回一个object.
 * - 所有插件被调用完成后, 合并所有结果.
 * - 然后用这个结果调用"实现", 其返回值将返回给"服务器".
 * - 返回值表示成功或失败, "服务器"会进行后续处理.
 *
 * 其中, "实现"里是真正希望接口做的事, 例如查询数据库等.
 * 而"插件"是需要的前置过程, 例如解析参数, 解析文件等.
 */
export abstract class 接口逻辑<
  插件类型 extends 插件项类型[],
  逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  返回类型 extends 接口逻辑正确类型,
> {
  static 混合<逻辑们 extends 任意的接口逻辑[]>(逻辑们: [...逻辑们]): 计算混合组合数组<逻辑们> {
    return 逻辑们.reduce((s, a) => s.混合(a)) as any
  }

  static 构造<
    插件类型 extends 插件项类型[],
    逻辑附加参数类型 extends 接口逻辑附加参数类型,
    错误类型 extends 接口逻辑错误类型,
    返回类型 extends 接口逻辑正确类型,
  >(
    插件们: [...插件类型],
    实现: (参数: 合并插件结果<插件类型>, 逻辑附加参数: 逻辑附加参数类型) => Promise<Either<错误类型, 返回类型>>,
  ): 接口逻辑<插件类型, 逻辑附加参数类型, 错误类型, 返回类型> {
    return new (class extends 接口逻辑<插件类型, 逻辑附加参数类型, 错误类型, 返回类型> {
      override 获得插件们(): [...插件类型] {
        return 插件们
      }
      override 实现(参数: 合并插件结果<插件类型>, 逻辑附加参数: 逻辑附加参数类型): Promise<Either<错误类型, 返回类型>> {
        return 实现(参数, 逻辑附加参数)
      }
    })()
  }

  protected declare readonly __类型保持符号?: [插件类型, 逻辑附加参数类型, 错误类型, 返回类型]

  abstract 获得插件们(): [...插件类型]
  abstract 实现(参数: 合并插件结果<插件类型>, 逻辑附加参数: 逻辑附加参数类型): Promise<Either<错误类型, 返回类型>>

  async 运行(
    req: Request,
    res: Response,
    逻辑附加参数: 逻辑附加参数类型,
    插件附加参数: 插件附加参数,
  ): Promise<Either<错误类型, 返回类型>> {
    let log = (await Global.getItem('log')).extend(插件附加参数.请求id).extend('接口逻辑')

    let 插件们 = this.获得插件们()

    await log.debug('找到 %o 个 插件, 准备执行...', 插件们.length)
    let 所有插件结果: Record<string, any>[] = []
    for (let 插件 of 插件们) {
      let 插件本体 = await 插件.run()
      let 插件返回 = await 插件本体.运行(req, res, 插件附加参数)
      所有插件结果.push(插件返回)
    }
    let 合并插件结果 = 所有插件结果.reduce((s, a) => Object.assign(s, a), {})
    await log.debug('插件 执行完毕')

    await log.debug('准备执行接口实现...')
    let 实现结果 = await this.实现(合并插件结果 as any, 逻辑附加参数)
    await log.debug('接口实现执行完毕')

    return 实现结果
  }

  混合<
    输入的插件类型 extends 插件项类型[],
    输入的错误类型 extends 接口逻辑错误类型,
    输入的返回类型 extends 接口逻辑正确类型,
  >(
    输入: 接口逻辑<输入的插件类型, 返回类型, 输入的错误类型, 输入的返回类型>,
  ): 接口逻辑<
    [...插件类型, ...输入的插件类型],
    逻辑附加参数类型,
    错误类型 | 输入的错误类型,
    返回类型 & 输入的返回类型
  > {
    let self = this
    return 接口逻辑.构造([...this.获得插件们(), ...输入.获得插件们()], async (参数, 逻辑附加参数) => {
      let c = await self.实现(参数 as any, 逻辑附加参数)
      if (c.isLeft()) return c as any
      return await 输入.实现(参数 as any, Object.assign(逻辑附加参数, c.assertRight().getRight()))
    })
  }
}

export type 任意的接口逻辑 = 接口逻辑<any, any, any, any>
export type 可调用的接口逻辑 = 接口逻辑<any, Record<string, never>, any, any>
export type 获得接口逻辑插件类型<A> = A extends 接口逻辑<infer X, any, any, any> ? X : never
export type 获得接口逻辑附加参数类型<A> = A extends 接口逻辑<any, infer X, any, any> ? X : never
export type 获得接口逻辑错误类型<A> = A extends 接口逻辑<any, any, infer X, any> ? X : never
export type 获得接口逻辑正确类型<A> = A extends 接口逻辑<any, any, any, infer X> ? X : never
