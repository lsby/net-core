import { Either, Right } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { 普通对象深合并 } from '../help/help'
import { 联合转元组 } from '../help/interior'
import { 合并插件结果, 插件项类型 } from '../plugin/plug'
import { 请求附加参数类型 } from '../server/server'
import { 可序列化类型, 空对象 } from '../types/types'

export type 清理函数类型<插件类型 extends 插件项类型[], 逻辑附加参数类型 extends 接口逻辑附加参数类型> = (
  参数: 合并插件结果<插件类型>,
  逻辑附加参数: 逻辑附加参数类型,
  请求附加参数: 请求附加参数类型,
) => Promise<void>

export type 接口逻辑错误类型 = Record<string, 可序列化类型> | string | never
export type 接口逻辑正确类型 = Record<string, 可序列化类型>
export type 接口逻辑附加参数类型 = Record<string, 可序列化类型>

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
 * ### 绑定
 *
 * - 该类提供了`绑定`方法, 用于将多个接口逻辑实例合成一个复合接口逻辑.
 *   - 组合的接口逻辑会按顺序依次被调用.
 *   - 如果某接口逻辑返回左值, 则整个结构将立即返回该左值.
 *   - 否则, 将右值内容注入上下文, 允许之后的接口逻辑通过`逻辑附加参数`访问它.
 *   - 最终将返回所有接口的结果的与.
 * - 这类似于monad的do结构, 在该结构中, 每个运行结果都会被注入到全局上下文并消除monad包装, 而语句可以使用上下文的值.
 *
 * ### 其他组合方法用到再写
 */
export abstract class 接口逻辑Base<
  插件类型 extends 插件项类型[],
  in 逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  返回类型 extends 接口逻辑正确类型,
  上游接口类型 extends 任意接口逻辑 | null = null,
  最后接口类型 extends 任意接口逻辑 | null = null,
> {
  public static 空逻辑(): 接口逻辑Base<[], 空对象, never, {}, null, null> {
    return 接口逻辑Base.构造([], async () => new Right({}))
  }

  public static 完整构造<
    插件类型 extends 插件项类型[],
    逻辑附加参数类型 extends 接口逻辑附加参数类型,
    错误类型 extends 接口逻辑错误类型,
    返回类型 extends 接口逻辑正确类型,
    上游接口类型 extends 任意接口逻辑 | null,
    最后接口类型 extends 任意接口逻辑 | null,
  >(
    插件们: [...插件类型],
    实现: (
      参数: 合并插件结果<插件类型>,
      逻辑附加参数: 逻辑附加参数类型,
      请求附加参数: 请求附加参数类型,
    ) => Promise<Either<错误类型, 返回类型>>,
    清理函数: 清理函数类型<插件类型, 逻辑附加参数类型> | undefined,
    上游接口逻辑: 上游接口类型,
    最后接口逻辑: 最后接口类型,
  ): 接口逻辑Base<插件类型, 逻辑附加参数类型, 错误类型, 返回类型, 上游接口类型, 最后接口类型> {
    return new (class extends 接口逻辑Base<插件类型, 逻辑附加参数类型, 错误类型, 返回类型, 上游接口类型, 最后接口类型> {
      public override 获得清理函数(): 清理函数类型<插件类型, 逻辑附加参数类型> | undefined {
        return 清理函数
      }
      public override 获得插件们(): [...插件类型] {
        return 插件们
      }
      public override 实现(
        参数: 合并插件结果<插件类型>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<Either<错误类型, 返回类型>> {
        return 实现(参数, 逻辑附加参数, 请求附加参数)
      }
    })(上游接口逻辑, 最后接口逻辑)
  }

  public static 构造<
    插件类型 extends 插件项类型[],
    逻辑附加参数类型 extends 接口逻辑附加参数类型,
    错误类型 extends 接口逻辑错误类型,
    返回类型 extends 接口逻辑正确类型,
  >(
    插件们: [...插件类型],
    实现: (
      参数: 合并插件结果<插件类型>,
      逻辑附加参数: 逻辑附加参数类型,
      请求附加参数: 请求附加参数类型,
    ) => Promise<Either<错误类型, 返回类型>>,
    清理函数?: 清理函数类型<插件类型, 逻辑附加参数类型> | undefined,
  ): 接口逻辑Base<插件类型, 逻辑附加参数类型, 错误类型, 返回类型, null, null> {
    return this.完整构造(插件们, 实现, 清理函数, null, null)
  }

  declare protected readonly __类型保持符号_协变?: [插件类型, 错误类型, 返回类型]
  declare protected readonly __类型保持符号_逆变?: (a: 逻辑附加参数类型) => void

  public constructor(
    private 上游接口: 上游接口类型,
    private 最后接口: 最后接口类型,
  ) {}

  public async 计算插件结果(
    req: Request,
    res: Response,
    请求附加参数: 请求附加参数类型,
  ): Promise<合并插件结果<插件类型>> {
    let 插件们 = this.获得插件们()
    let 所有插件结果: Record<string, any>[] = []
    for (let 插件 of 插件们) {
      let 插件返回 = await 插件.运行(req, res, 请求附加参数)
      所有插件结果.push(插件返回)
    }
    let 合并结果 = 所有插件结果.reduce((s, a) => 普通对象深合并(s, a), {})

    return 合并结果 as 合并插件结果<插件类型>
  }

  public abstract 获得插件们(): [...插件类型]
  public abstract 实现(
    参数: 合并插件结果<插件类型>,
    逻辑附加参数: 逻辑附加参数类型,
    请求附加参数: 请求附加参数类型,
  ): Promise<Either<错误类型, 返回类型>>
  public 获得清理函数?(): 清理函数类型<插件类型, 逻辑附加参数类型> | undefined

  public async 通过插件结果运行(
    合并插件结果: 合并插件结果<插件类型>,
    传入的逻辑附加参数: 逻辑附加参数类型,
    传入的请求附加参数: 请求附加参数类型,
  ): Promise<Either<错误类型, 返回类型>> {
    let 清理函数 = this.获得清理函数?.()
    let 最终结果: Either<错误类型, 返回类型> | undefined = void 0

    try {
      let 实现结果 = await this.实现(合并插件结果 as any, 传入的逻辑附加参数, 传入的请求附加参数)

      最终结果 = 实现结果.map((a) => 普通对象深合并(传入的逻辑附加参数, a) as any)

      return 最终结果
    } finally {
      if (清理函数 !== void 0) {
        let 上层绑定结果 =
          最终结果 !== void 0 && 最终结果.isRight() === true
            ? (最终结果.assertRight().getRight() as unknown as 逻辑附加参数类型)
            : 传入的逻辑附加参数
        await 清理函数(合并插件结果 as any, 上层绑定结果, 传入的请求附加参数)
      }
    }
  }
  public async 运行(
    req: Request,
    res: Response,
    传入的逻辑附加参数: 逻辑附加参数类型,
    传入的插件附加参数: 请求附加参数类型,
  ): Promise<Either<错误类型, 返回类型>> {
    let 合并插件结果 = await this.计算插件结果(req, res, 传入的插件附加参数)
    return this.通过插件结果运行(合并插件结果, 传入的逻辑附加参数, 传入的插件附加参数)
  }

  public 绑定<
    输入的插件类型 extends 插件项类型[],
    输入的错误类型 extends 接口逻辑错误类型,
    输入的返回类型 extends 接口逻辑正确类型,
    输入的上游接口逻辑类型 extends 任意接口逻辑 | null,
    输入的最后接口逻辑类型 extends 任意接口逻辑 | null,
  >(
    输入: 接口逻辑Base<
      输入的插件类型,
      返回类型,
      输入的错误类型,
      输入的返回类型,
      输入的上游接口逻辑类型,
      输入的最后接口逻辑类型
    >,
  ): 接口逻辑Base<
    [...插件类型, ...输入的插件类型],
    逻辑附加参数类型,
    错误类型 | 输入的错误类型,
    返回类型 & 输入的返回类型,
    typeof this,
    typeof 输入
  > {
    let 上清理 = this.获得清理函数?.()
    let 下清理 = 输入.获得清理函数?.()

    let 合并清理: 清理函数类型<[...插件类型, ...输入的插件类型], 逻辑附加参数类型> | undefined = void 0
    if (上清理 !== void 0 && 下清理 !== void 0) {
      合并清理 = async (
        参数: 合并插件结果<[...插件类型, ...输入的插件类型]>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<void> => {
        await 上清理(参数 as any, 逻辑附加参数, 请求附加参数)
        await 下清理(参数 as any, 逻辑附加参数 as any, 请求附加参数)
      }
    } else if (上清理 !== void 0) {
      合并清理 = async (
        参数: 合并插件结果<[...插件类型, ...输入的插件类型]>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<void> => {
        await 上清理(参数 as any, 逻辑附加参数, 请求附加参数)
      }
    } else if (下清理 !== void 0) {
      合并清理 = async (
        参数: 合并插件结果<[...插件类型, ...输入的插件类型]>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<void> => {
        await 下清理(参数 as any, 逻辑附加参数 as any, 请求附加参数)
      }
    }

    return 接口逻辑Base.完整构造(
      [...this.获得插件们(), ...输入.获得插件们()],
      async (参数, 逻辑附加参数, 请求附加参数) => {
        let 上层调用结果 = await this.实现(参数 as any, 逻辑附加参数, 请求附加参数)
        if (上层调用结果.isLeft()) return 上层调用结果 as any

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let 传给下一层的 = 普通对象深合并(逻辑附加参数, 上层调用结果.assertRight().getRight()) as any
        let 下层调用结果 = await 输入.实现(参数 as any, 传给下一层的, 请求附加参数)

        let 最终返回结果 = 下层调用结果.map((a) => 普通对象深合并(传给下一层的, a) as any)
        return 最终返回结果
      },
      合并清理,
      this,
      输入,
    )
  }

  public 获得上游接口(): 上游接口类型 {
    return this.上游接口
  }
  public 获得最后接口(): 最后接口类型 {
    return this.最后接口
  }
}

export abstract class 接口逻辑<
  插件类型 extends 插件项类型[],
  逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  返回类型 extends 接口逻辑正确类型,
> extends 接口逻辑Base<插件类型, 逻辑附加参数类型, 错误类型, 返回类型, null, null> {
  public constructor() {
    super(null, null)
  }
}

export type 任意接口逻辑 = 接口逻辑Base<any, any, any, any, any, any>
export type 获得接口逻辑插件类型<A> = A extends 接口逻辑Base<infer X, any, any, any, any, any> ? X : never
export type 获得接口逻辑附加参数类型<A> = A extends 接口逻辑Base<any, infer X, any, any, any, any> ? X : never
export type 获得接口逻辑错误类型<A> = A extends 接口逻辑Base<any, any, infer X, any, any, any> ? X : never
export type 获得接口逻辑正确类型<A> = A extends 接口逻辑Base<any, any, any, infer X, any, any> ? X : never
export type 获得接口逻辑上游接口类型<A> = A extends 接口逻辑Base<any, any, any, any, infer X, any> ? X : never
export type 获得接口逻辑最后接口类型<A> = A extends 接口逻辑Base<any, any, any, any, any, infer X> ? X : never

export type 计算接口逻辑参数<接口逻辑> = 合并插件结果<获得接口逻辑插件类型<接口逻辑>>
export type 计算接口逻辑错误结果<接口逻辑> = 联合转元组<获得接口逻辑错误类型<接口逻辑>>
export type 计算接口逻辑正确结果<接口逻辑> = {
  [k in keyof 获得接口逻辑正确类型<接口逻辑>]: 获得接口逻辑正确类型<接口逻辑>[k]
}
