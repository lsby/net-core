import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
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
 * # 接口逻辑的基础抽象类
 *
 * - 该类表示一个接口的逻辑执行过程, 包括插件的运行, 结果的合并以及业务逻辑的实际执行.
 * - 插件提供预处理功能, 例如参数解析等, 它通过解析express的上下文, 获得结果并提供给实现.
 * - 实现函数负责业务逻辑的主要操作, 例如数据库查询等, 它接收插件的处理结果, 并返回计算结果(用Either表示).
 * - 运行时除了获得express上下文外, 还可以接收自定义参数, 称为`逻辑附加参数`.
 * - 每个接口逻辑实例可以通过一些方法与其他接口逻辑合并, 形成一个复杂的流程.
 *
 * ## 构造:
 *
 * - 可以通过继承该抽象类, 并实现抽象函数来使用.
 * - 也可以通过静态方法`构造`来直接进行构造.
 *
 * ## 组合
 *
 * 通过组合, 可以将简单的逻辑模块化, 并按需构建复杂的接口处理流程.
 *
 * ### 混合
 *
 * - 该类提供了`混合`方法, 用于将多个接口逻辑实例合成一个复合接口逻辑.
 *   - 组合的接口逻辑会按顺序依次被调用.
 *   - 如果某接口逻辑返回左值, 则整个结构将立即返回该左值.
 *   - 否则, 将右值内容注入上下文, 允许之后的接口逻辑通过`逻辑附加参数`访问它.
 *   - 最终将返回最后一个接口逻辑的运行结果.
 * - 这类似于monad的do结构, 在该结构中, 每个运行结果都会被注入到全局上下文并消除monad包装, 而语句可以使用上下文的值.
 *
 * ### 其他组合方法用到再写
 */
export abstract class 接口逻辑<
  插件类型 extends 插件项类型[],
  逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  返回类型 extends 接口逻辑正确类型,
> {
  static 混合<逻辑们 extends 任意接口逻辑[]>(逻辑们: [...逻辑们]): 计算混合组合数组<逻辑们> {
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
    逻辑附加参数?: Partial<逻辑附加参数类型> | undefined,
  ): 接口逻辑<插件类型, 逻辑附加参数类型, 错误类型, 返回类型> {
    let c = new (class extends 接口逻辑<插件类型, 逻辑附加参数类型, 错误类型, 返回类型> {
      override 获得插件们(): [...插件类型] {
        return 插件们
      }
      override 实现(参数: 合并插件结果<插件类型>, 逻辑附加参数: 逻辑附加参数类型): Promise<Either<错误类型, 返回类型>> {
        return 实现(参数, 逻辑附加参数)
      }
    })()
    c.内部的逻辑附加参数 = 逻辑附加参数 ?? {}
    return c
  }

  private 内部的逻辑附加参数: Partial<逻辑附加参数类型> = {}

  protected declare readonly __类型保持符号?: [插件类型, 逻辑附加参数类型, 错误类型, 返回类型]

  abstract 获得插件们(): [...插件类型]
  abstract 实现(参数: 合并插件结果<插件类型>, 逻辑附加参数: 逻辑附加参数类型): Promise<Either<错误类型, 返回类型>>

  async 运行(
    req: Request,
    res: Response,
    传入的逻辑附加参数: 逻辑附加参数类型,
    传入的插件附加参数: 插件附加参数,
  ): Promise<Either<错误类型, 返回类型>> {
    let log = (await Global.getItem('log')).extend(传入的插件附加参数.请求id).extend('接口逻辑')

    let 插件们 = this.获得插件们()

    await log.debug('找到 %o 个 插件, 准备执行...', 插件们.length)
    let 所有插件结果: Record<string, any>[] = []
    for (let 插件 of 插件们) {
      let 插件本体 = await 插件.run()
      let 插件返回 = await 插件本体.运行(req, res, 传入的插件附加参数)
      所有插件结果.push(插件返回)
    }
    let 合并插件结果 = 所有插件结果.reduce((s, a) => Object.assign(s, a), {})
    await log.debug('插件 执行完毕')

    await log.debug('准备执行接口实现...')
    let 实现结果 = await this.实现(合并插件结果 as any, Object.assign(this.内部的逻辑附加参数, 传入的逻辑附加参数))
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

export type 任意接口逻辑 = 接口逻辑<any, any, any, any>
export type 可调用接口逻辑 = 接口逻辑<any, Record<string, never>, any, any>
export type 获得接口逻辑插件类型<A> = A extends 接口逻辑<infer X, any, any, any> ? X : never
export type 获得接口逻辑附加参数类型<A> = A extends 接口逻辑<any, infer X, any, any> ? X : never
export type 获得接口逻辑错误类型<A> = A extends 接口逻辑<any, any, infer X, any> ? X : never
export type 获得接口逻辑正确类型<A> = A extends 接口逻辑<any, any, any, infer X> ? X : never

export abstract class 接口逻辑组件<
  插件类型 extends 插件项类型[],
  逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  返回类型 extends 接口逻辑正确类型,
> extends 接口逻辑<插件类型, 逻辑附加参数类型, 错误类型, 返回类型> {
  constructor(private 插件们: [...插件类型]) {
    super()
  }

  override 获得插件们(): [...插件类型] {
    return this.插件们
  }
}
