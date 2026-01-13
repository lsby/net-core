import { Either, Right } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { 普通对象深合并 } from '../help/help'
import { 联合转元组 } from '../help/interior'
import { 空对象, 请求附加参数类型 } from '../types/types'
import type { 接口 } from './interface-base'
import type { 插件 } from './interface-plugin'
import { 任意插件, 合并插件正确结果 } from './interface-plugin'

export type 清理函数类型<插件类型 extends 任意插件[], 逻辑附加参数类型 extends 接口逻辑附加参数类型> = (
  参数: 合并插件正确结果<插件类型>,
  逻辑附加参数: 逻辑附加参数类型,
  请求附加参数: 请求附加参数类型,
) => Promise<void>

export type 接口逻辑错误类型 = Record<string, any> | string | never
export type 接口逻辑正确类型 = Record<string, any>
export type 接口逻辑附加参数类型 = Record<string, any>

/**
 * ### 接口逻辑
 *
 * 接口逻辑是接口的实际行为, 它由以下部分组成:
 * - 插件: 业务逻辑的前置行为, 通过与req句柄交互, 获得接口需要的信息, 见 {@link 插件}
 * - 业务逻辑: 实际的运行逻辑, 是一个函数
 *   - 业务逻辑的参数是:
 *     - 参数: 当前接口逻辑的插件提供的数据
 *     - 逻辑附加参数: 上游接口逻辑提供的数据和能力
 *     - 请求附加参数: 框架提供的信息, 例如请求id
 *   - 业务逻辑应当返回 Either 值, 表示执行成功还是失败
 *   - 业务逻辑应当尽可能是纯的, 便于单独测试和调用
 *
 * #### 两用性
 *
 * 接口逻辑可以被两种不同的方法使用:
 * - 组成接口: 将其作为 {@link 接口} 的一部分.
 *   此时, 插件会被执行, 插件将从HTTP上下文中获得信息, 提供给业务逻辑.
 * - 内部调用: 使用 .调用 方法, 在其他代码中调用接口逻辑.
 *   此时, 插件会被跳过, 不会从HTTP上下文中获取任何信息(因为根本就不存在HTTP上下文).
 *   而本来由插件提供的信息将改为需要通过调用参数提供(是类型安全的).
 * 这意味着大部分接口逻辑的实现是纯的, 并且可以独立被调用, 非常容易被测试
 *
 * #### 组合
 *
 * 允许将多个接口逻辑进行组合, 形成新的接口逻辑
 * - 目前只提供"绑定"一种组合方式
 * - 未来可能提供更多组合方法
 *
 * ##### 绑定
 *
 * 这种组合方式将接口逻辑看作一个类monad结构的Either
 *
 * 考虑这样的代码:
 *
 * ```typescript
 * 接口逻辑.空逻辑()
 *   .绑定(A)
 *   .绑定(B) // B中可以调用A的返回结果
 *   .绑定(C) // C中可以调用A和B的返回结果
 * ```
 *
 * 这类似于:
 *
 * ```haskell
 * do
 *   a <- A
 *   b <- B // B中可以调用a
 *   c <- C // C中可以调用a和b
 *   pure {a, b, c}
 * ```
 *
 * 注意: 上面的A, B, C的结果皆为Either, 如果返回左值, 后续过程将直接被跳过
 *
 * ## 复用性和代数效应
 *
 * 推荐抽象通用组件, 并构造纯代数效应链:
 *
 * 考虑这样的代码:
 *
 * ```typescript
 * 接口逻辑.空逻辑()
 *   .绑定(用户鉴权)      // 通用, 可通过参数与业务解耦, 实现跨项目复用
 *   .绑定(缓存)          // 通用, 可通过参数与业务解耦, 实现跨项目复用
 *   .绑定(限流)          // 通用, 可通过参数与业务解耦, 实现跨项目复用
 *   .绑定(业务相关逻辑)  // 业务相关逻辑, 但不触发副作用, 而是返回"描述副作用的数据"
 *   .绑定(操作数据库)    // 业务相关逻辑, 解析"描述副作用的数据", 并实际执行
 * ```
 *
 * 这样的好处是:
 * - 跨项目复用的逻辑块
 * - 业务逻辑可以保持是纯的, 非常方便独立测试
 */
export abstract class 接口逻辑Base<
  插件类型 extends 任意插件[],
  in 逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  正确类型 extends 接口逻辑正确类型,
  上游接口类型 extends 任意接口逻辑 | null = null,
  最后接口类型 extends 任意接口逻辑 | null = null,
> {
  public static 空逻辑(): 接口逻辑Base<[], 空对象, never, {}, null, null> {
    return 接口逻辑Base.构造([], async () => new Right({}))
  }

  public static 完整构造<
    插件类型 extends 任意插件[],
    逻辑附加参数类型 extends 接口逻辑附加参数类型,
    错误类型 extends 接口逻辑错误类型,
    返回类型 extends 接口逻辑正确类型,
    上游接口类型 extends 任意接口逻辑 | null,
    最后接口类型 extends 任意接口逻辑 | null,
  >(
    插件们: [...插件类型],
    实现: (
      参数: 合并插件正确结果<插件类型>,
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
        参数: 合并插件正确结果<插件类型>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<Either<错误类型, 返回类型>> {
        return 实现(参数, 逻辑附加参数, 请求附加参数)
      }
    })(上游接口逻辑, 最后接口逻辑)
  }

  public static 构造<
    插件类型 extends 任意插件[],
    逻辑附加参数类型 extends 接口逻辑附加参数类型,
    错误类型 extends 接口逻辑错误类型,
    返回类型 extends 接口逻辑正确类型,
  >(
    插件们: [...插件类型],
    实现: (
      参数: 合并插件正确结果<插件类型>,
      逻辑附加参数: 逻辑附加参数类型,
      请求附加参数: 请求附加参数类型,
    ) => Promise<Either<错误类型, 返回类型>>,
    清理函数?: 清理函数类型<插件类型, 逻辑附加参数类型> | undefined,
  ): 接口逻辑Base<插件类型, 逻辑附加参数类型, 错误类型, 返回类型, null, null> {
    return this.完整构造(插件们, 实现, 清理函数, null, null)
  }

  declare protected readonly __类型保持符号_协变?: [插件类型, 错误类型, 正确类型]
  declare protected readonly __类型保持符号_逆变?: (a: 逻辑附加参数类型) => void

  public constructor(
    private 上游接口: 上游接口类型,
    private 最后接口: 最后接口类型,
  ) {}

  public async 计算插件结果(
    req: Request,
    res: Response,
    请求附加参数: 请求附加参数类型,
  ): Promise<Either<{ code: number; data: any }, 合并插件正确结果<插件类型>>> {
    let 插件们 = this.获得插件们()
    let 所有插件结果: Record<string, any>[] = []

    for (let 插件 of 插件们) {
      let 插件返回 = await 插件.运行(req, res, 请求附加参数)
      if (插件返回.isLeft()) return 插件返回 as any
      所有插件结果.push(插件返回.assertRight().getRight())
    }

    let 合并结果 = 所有插件结果.reduce((s, a) => 普通对象深合并(s, a), {})
    return new Right(合并结果 as any)
  }

  public abstract 获得插件们(): [...插件类型]
  public abstract 实现(
    参数: 合并插件正确结果<插件类型>,
    逻辑附加参数: 逻辑附加参数类型,
    请求附加参数: 请求附加参数类型,
  ): Promise<Either<错误类型, 正确类型>>
  public 获得清理函数?(): 清理函数类型<插件类型, 逻辑附加参数类型> | undefined

  public async 调用(
    合并插件结果: 合并插件正确结果<插件类型>,
    传入的逻辑附加参数: 逻辑附加参数类型,
    传入的请求附加参数: 请求附加参数类型,
  ): Promise<Either<错误类型, 正确类型>> {
    let 清理函数 = this.获得清理函数?.()
    let 最终结果: Either<错误类型, 正确类型> | undefined = void 0

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

  public 绑定<
    输入的插件类型 extends 任意插件[],
    输入的错误类型 extends 接口逻辑错误类型,
    输入的返回类型 extends 接口逻辑正确类型,
    输入的上游接口逻辑类型 extends 任意接口逻辑 | null,
    输入的最后接口逻辑类型 extends 任意接口逻辑 | null,
  >(
    输入: 接口逻辑Base<
      输入的插件类型,
      正确类型,
      输入的错误类型,
      输入的返回类型,
      输入的上游接口逻辑类型,
      输入的最后接口逻辑类型
    >,
  ): 接口逻辑Base<
    [...插件类型, ...输入的插件类型],
    逻辑附加参数类型,
    错误类型 | 输入的错误类型,
    正确类型 & 输入的返回类型,
    typeof this,
    typeof 输入
  > {
    let 上清理 = this.获得清理函数?.()
    let 下清理 = 输入.获得清理函数?.()

    let 合并清理: 清理函数类型<[...插件类型, ...输入的插件类型], 逻辑附加参数类型> | undefined = void 0
    if (上清理 !== void 0 && 下清理 !== void 0) {
      合并清理 = async (
        参数: 合并插件正确结果<[...插件类型, ...输入的插件类型]>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<void> => {
        await 上清理(参数 as any, 逻辑附加参数, 请求附加参数)
        await 下清理(参数 as any, 逻辑附加参数 as any, 请求附加参数)
      }
    } else if (上清理 !== void 0) {
      合并清理 = async (
        参数: 合并插件正确结果<[...插件类型, ...输入的插件类型]>,
        逻辑附加参数: 逻辑附加参数类型,
        请求附加参数: 请求附加参数类型,
      ): Promise<void> => {
        await 上清理(参数 as any, 逻辑附加参数, 请求附加参数)
      }
    } else if (下清理 !== void 0) {
      合并清理 = async (
        参数: 合并插件正确结果<[...插件类型, ...输入的插件类型]>,
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

/**
 * 详情见 {@link 接口逻辑Base}
 */
export abstract class 接口逻辑<
  插件类型 extends 任意插件[],
  逻辑附加参数类型 extends 接口逻辑附加参数类型,
  错误类型 extends 接口逻辑错误类型,
  正确类型 extends 接口逻辑正确类型,
> extends 接口逻辑Base<插件类型, 逻辑附加参数类型, 错误类型, 正确类型, null, null> {
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

export type 计算接口逻辑参数<接口逻辑> = 合并插件正确结果<获得接口逻辑插件类型<接口逻辑>>
export type 计算接口逻辑错误结果<接口逻辑> = 联合转元组<获得接口逻辑错误类型<接口逻辑>>
export type 计算接口逻辑正确结果<接口逻辑> = {
  [k in keyof 获得接口逻辑正确类型<接口逻辑>]: 获得接口逻辑正确类型<接口逻辑>[k]
}
