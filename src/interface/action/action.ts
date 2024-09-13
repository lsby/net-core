import { Either, Left, Right } from '@lsby/ts-fp-data'

export type 业务行为错误类型 = string | never
export type 业务行为参数类型 = Record<string, any>
export type 业务行为返回类型 = Record<string, any>

type 任意业务行为 = 业务行为<any, any, any>
type 计算混合组合<
  A参数类型 extends 业务行为参数类型,
  A错误类型 extends 业务行为错误类型,
  A返回类型 extends 业务行为返回类型,
  B参数类型 extends 业务行为参数类型,
  B错误类型 extends 业务行为错误类型,
  B返回类型 extends 业务行为返回类型,
> = 业务行为<A参数类型 & Omit<B参数类型, keyof A返回类型>, A错误类型 | B错误类型, A返回类型 & B返回类型>
type 计算混合单一组合<A, B> =
  A extends 业务行为<infer A参数, infer A错误, infer A返回>
    ? B extends 业务行为<infer B参数, infer B错误, infer B返回>
      ? 计算混合组合<A参数, A错误, A返回, B参数, B错误, B返回>
      : never
    : never
type 计算混合组合数组<Arr> = Arr extends [infer x, infer y]
  ? 计算混合单一组合<x, y>
  : Arr extends [infer x, infer y, ...infer s]
    ? 计算混合组合数组<[计算混合单一组合<x, y>, ...s]>
    : never
type 计算合并<Arr> = Arr extends []
  ? 业务行为<{}, never, {}>
  : Arr extends [infer x, ...infer xs]
    ? x extends 业务行为<infer 参数1, infer 错误1, infer 返回1>
      ? 计算合并<xs> extends 业务行为<infer 参数2, infer 错误2, infer 返回2>
        ? 业务行为<参数1 & 参数2, 错误1 | 错误2, 返回1 & 返回2>
        : never
      : never
    : never
type 取参数<A> = A extends 业务行为<infer 参数, infer _错误, infer _返回> ? 参数 : never
type 取错误<A> = A extends 业务行为<infer _参数, infer 错误, infer _返回> ? 错误 : never
type 取返回<A> = A extends 业务行为<infer _参数, infer _错误, infer 返回> ? 返回 : never

/**
 * ## 业务行为
 *
 * 业务行为是代码中业务逻辑的抽象表示
 * 其本质是一个执行特定业务逻辑的函数
 * 其特点是:
 * - 业务相关: 比起普通函数, 特化了一部分逻辑, 以更好的适应业务逻辑的需要
 * - 类型安全: 遵循 先类型 后实现 的原则
 * - 可组合: 基于该模型, 可以创建出各种具有想象力的组合模式
 *
 * ## 实现
 *
 * 对于业务行为而言, 至少应该明确:
 * - 参数: 该函数需要的信息
 * - 错误: 该函数可能发生的错误
 * - 返回: 该函数正确执行时返回的数据
 *
 * 当编写一个业务行为时, 必须先明确以上值的类型, 然后继承该基类进行实现
 *
 * 实现中, 可以获得参数.
 * 实现中, 必须返回一个左值或一个右值, 当然也可能意外抛出错误
 * 当意外的抛出错误时, 会原封不动的抛出错误
 *
 * ## 组合
 *
 * 可以将业务逻辑进行组合, 创造出新的业务逻辑
 *
 * ## 使用
 *
 * 通过`运行业务行为`来执行该业务行为
 * 这将会得到实现中返回的结果
 */
export abstract class 业务行为<
  参数类型 extends 业务行为参数类型,
  错误类型 extends 业务行为错误类型,
  返回类型 extends 业务行为返回类型,
> {
  // ================================= 静态 =================================
  static 通过实现构造<
    参数类型 extends 业务行为参数类型,
    错误类型 extends 业务行为错误类型,
    返回类型 extends 业务行为返回类型,
  >(实现: (参数: 参数类型) => Promise<Either<错误类型, 返回类型>>): 业务行为<参数类型, 错误类型, 返回类型> {
    return new (class extends 业务行为<参数类型, 错误类型, 返回类型> {
      protected override async 业务行为实现(参数: 参数类型): Promise<Either<错误类型, 返回类型>> {
        return 实现(参数)
      }
    })()
  }
  static 通过正确值构造<
    参数类型 extends 业务行为参数类型,
    错误类型 extends 业务行为错误类型,
    返回类型 extends 业务行为返回类型,
  >(a: 返回类型): 业务行为<参数类型, 错误类型, 返回类型> {
    return 业务行为.通过实现构造(async () => new Right(a))
  }
  static 通过错误值构造<
    参数类型 extends 业务行为参数类型,
    错误类型 extends 业务行为错误类型,
    返回类型 extends 业务行为返回类型,
  >(a: 错误类型): 业务行为<参数类型, 错误类型, 返回类型> {
    return 业务行为.通过实现构造(async () => new Left(a))
  }

  static 流式组合<
    A参数类型 extends 业务行为参数类型,
    A错误类型 extends 业务行为错误类型,
    A返回类型 extends 业务行为返回类型,
    B错误类型 extends 业务行为错误类型,
    B返回类型 extends 业务行为返回类型,
  >(
    a: 业务行为<A参数类型, A错误类型, A返回类型>,
    b: 业务行为<A返回类型, B错误类型, B返回类型>,
  ): 业务行为<A参数类型, A错误类型 | B错误类型, B返回类型> {
    return a.流式组合(b)
  }

  static 混合组合<
    A参数类型 extends 业务行为参数类型,
    A错误类型 extends 业务行为错误类型,
    A返回类型 extends 业务行为返回类型,
    B参数类型 extends 业务行为参数类型,
    B错误类型 extends 业务行为错误类型,
    B返回类型 extends 业务行为返回类型,
  >(
    a: 业务行为<A参数类型, A错误类型, A返回类型>,
    b: 业务行为<B参数类型, B错误类型, B返回类型>,
  ): 计算混合组合<A参数类型, A错误类型, A返回类型, B参数类型, B错误类型, B返回类型> {
    return a.混合组合(b)
  }

  /**
   * 对多个项混合组合
   */
  static 混合组合多项<A extends 任意业务行为[]>(arr: [...A]): 计算混合组合数组<A> {
    return arr.reduce((s, a) => s.混合组合(a)) as any
  }

  /**
   * 同时运行多个模型, 并提供一个函数处理它们的结果
   * 如果其中任何一个模型发生错误, 则最终模型输出第一个错误
   * 处理函数的类型是: 所有模型的结果合并 => 泛型A
   * 新模型的类型是:
   * - 参数: 所有模型的参数合并
   * - 错误: 所有模型的错误合并
   * - 返回值: 泛型A
   */
  static 并行组合<X extends 任意业务行为[], A extends 业务行为返回类型>(
    arr: [...X],
    f: (a: 取返回<计算合并<X>>) => Promise<A>,
  ): 业务行为<取参数<计算合并<X>>, 取错误<计算合并<X>>, A> {
    return 业务行为.通过实现构造(async (参数) => {
      var 所有结果 = await Promise.all(arr.map((a) => a.运行业务行为(参数)))
      var 错误 = 所有结果.filter((a) => a.isLeft())[0]
      if (错误) return 错误
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      var 正确结果合并 = 所有结果.map((a) => a.assertRight().getRight()).reduce((s, a) => Object.assign(s, a), {})
      return new Right(await f(正确结果合并))
    })
  }

  // ================================= 私有 =================================
  protected abstract 业务行为实现(参数: 参数类型): Promise<Either<错误类型, 返回类型>>

  // ================================= 设置 =================================
  设置参数<A extends Partial<参数类型>>(设置参数: A): 业务行为<Omit<参数类型, keyof A>, 错误类型, 返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      return await this.运行业务行为({ ...设置参数, ...参数 } as any)
    })
  }

  // ================================= 运行 =================================
  async 运行业务行为(参数: 参数类型): Promise<Either<错误类型, 返回类型>> {
    try {
      return await this.业务行为实现(参数)
    } catch (e) {
      throw e
    }
  }

  // ================================= 组合 =================================
  /**
   * 将两个模型串接, 得到一个新模型, 新模型的类型是:
   * - 参数: a模型的参数
   * - 错误: a模型的错误+b模型的错误
   * - 返回值: b模型的返回值
   */
  流式组合<B错误类型 extends 业务行为错误类型, B返回类型 extends 业务行为返回类型>(
    b: 业务行为<返回类型, B错误类型, B返回类型>,
  ): 业务行为<参数类型, 错误类型 | B错误类型, B返回类型> {
    return 业务行为.通过实现构造(async (参数): Promise<Either<错误类型 | B错误类型, B返回类型>> => {
      const 我的结果 = await this.运行业务行为(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft())
      return b.运行业务行为(我的结果.assertRight().getRight())
    })
  }

  /**
   * 将两个模型串接, 得到一个新的模型
   * 相比流式组合, 本函数不要求串联位置参数匹配, 缺少的参数将在调用时补全
   * 新模型的类型是:
   * - 参数: a模型的参数+(b模型的参数-a模型的返回值)
   * - 错误: a模型的错误+b模型的错误
   * - 返回值: a模型的返回值+b模型的返回值
   */
  混合组合<B参数类型 extends 业务行为参数类型, B错误类型 extends 业务行为错误类型, B返回类型 extends 业务行为返回类型>(
    b: 业务行为<B参数类型, B错误类型, B返回类型>,
  ): 计算混合组合<参数类型, 错误类型, 返回类型, B参数类型, B错误类型, B返回类型> {
    return 业务行为.通过实现构造(async (参数): Promise<Either<错误类型 | B错误类型, 返回类型 & B返回类型>> => {
      const 我的结果 = await this.运行业务行为(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft())
      var 对方结果 = await b.运行业务行为({ ...参数, ...我的结果.assertRight().getRight() } as any)
      return 对方结果.map((a) => Object.assign(a, 我的结果.assertRight().getRight()))
    })
  }

  // ================================= 映射 =================================
  映射结果<新返回类型 extends 业务行为返回类型>(
    f: (a: 返回类型) => 新返回类型,
  ): 业务行为<参数类型, 错误类型, 新返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      const 我的结果 = await this.运行业务行为(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft())
      return Either.pure(f(我的结果.assertRight().getRight()))
    })
  }
  映射错误<新错误类型 extends 业务行为错误类型>(
    f: (a: 错误类型) => 新错误类型,
  ): 业务行为<参数类型, 新错误类型, 返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      const 我的结果 = await this.运行业务行为(参数)
      if (我的结果.isLeft()) return new Left(f(我的结果.assertLeft().getLeft()))
      return Either.pure(我的结果.assertRight().getRight())
    })
  }

  绑定<
    新参数类型 extends 业务行为参数类型 & 参数类型,
    新错误类型 extends 错误类型 | 业务行为错误类型,
    新返回类型 extends 业务行为返回类型,
  >(f: (a: 返回类型) => 业务行为<新参数类型, 新错误类型, 新返回类型>): 业务行为<新参数类型, 新错误类型, 新返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      const 我的结果 = await this.运行业务行为(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft() as 新错误类型)
      return f(我的结果.assertRight().getRight()).运行业务行为(参数)
    })
  }
}
