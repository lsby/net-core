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
type 计算混合组合数组<Arr> = Arr extends [infer x]
  ? x
  : Arr extends [infer x, infer y]
    ? 计算混合单一组合<x, y>
    : Arr extends [infer x, infer y, ...infer s]
      ? 计算混合组合数组<[计算混合单一组合<x, y>, ...s]>
      : undefined
type 计算合并<Arr> = Arr extends []
  ? 业务行为<{}, never, {}>
  : Arr extends [infer x, ...infer xs]
    ? x extends 业务行为<infer 参数1, infer 错误1, infer 返回1>
      ? 计算合并<xs> extends 业务行为<infer 参数2, infer 错误2, infer 返回2>
        ? 业务行为<参数1 & 参数2, 错误1 | 错误2, 返回1 & 返回2>
        : never
      : never
    : never
export type 计算业务行为参数<A> = A extends 业务行为<infer 参数, infer _错误, infer _返回> ? 参数 : never
export type 计算业务行为错误<A> = A extends 业务行为<infer _参数, infer 错误, infer _返回> ? 错误 : never
export type 计算业务行为返回<A> = A extends 业务行为<infer _参数, infer _错误, infer 返回> ? 返回 : never

/**
 * # 业务行为
 *
 * 业务行为是代码中业务逻辑的抽象表示
 * 其本质是一个执行特定业务逻辑的函数
 *
 * ## 特点
 *
 * 其特点是:
 * - 业务相关: 比起普通函数, 特化了一部分逻辑, 以更好的适应业务逻辑的需要
 * - 类型安全: 严格的类型控制
 * - 可组合: 基于该模型, 可以创建出各种具有想象力的组合模式
 *
 * ## 实现
 *
 * 对于业务行为而言, 至少应该明确:
 * - 参数: 该函数需要的信息, 必须是对象
 * - 错误: 该函数可能发生的错误, 错误只能是字符串, 如果不可能产生错误使用never
 * - 返回: 该函数正确执行时返回的数据, 必须是对象
 *
 * 当编写一个业务行为时, 必须先明确以上类型, 然后继承该基类进行实现
 *
 * 实现中, 可以获得调用时提供的参数.
 * 实现中, 必须返回一个左值或一个右值, 当然也可能意外抛出错误
 * 当意外的抛出错误时, 不同的调用方法处理不一样
 */
export abstract class 业务行为<
  参数类型 extends 业务行为参数类型,
  错误类型 extends 业务行为错误类型,
  返回类型 extends 业务行为返回类型,
> {
  // ================================= 静态 =================================
  public static 通过实现构造<
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
  public static 通过正确值构造<
    参数类型 extends 业务行为参数类型,
    错误类型 extends 业务行为错误类型,
    返回类型 extends 业务行为返回类型,
  >(a: 返回类型): 业务行为<参数类型, 错误类型, 返回类型> {
    return 业务行为.通过实现构造(async () => new Right(a))
  }
  public static 通过错误值构造<
    参数类型 extends 业务行为参数类型,
    错误类型 extends 业务行为错误类型,
    返回类型 extends 业务行为返回类型,
  >(a: 错误类型): 业务行为<参数类型, 错误类型, 返回类型> {
    return 业务行为.通过实现构造(async () => new Left(a))
  }

  public static 流式组合<
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

  public static 混合组合<
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
  public static 混合组合多项<A extends 任意业务行为[]>(arr: [...A]): 计算混合组合数组<A> {
    return arr.reduce((s, a) => s.混合组合(a)) as any
  }

  /**
   * 同时运行多个行为, 并提供一个函数处理它们的结果
   * 如果其中任何一个行为发生错误, 则最终行为输出第一个错误
   * 处理函数的类型是: 所有行为的结果合并 => 泛型A
   * 新行为的类型是:
   * - 参数: 所有行为的参数合并
   * - 错误: 所有行为的错误合并
   * - 返回值: 泛型A
   */
  public static 并行组合<X extends 任意业务行为[], A extends 业务行为返回类型>(
    arr: [...X],
    f: (a: 计算业务行为返回<计算合并<X>>) => Promise<A>,
  ): 业务行为<计算业务行为参数<计算合并<X>>, 计算业务行为错误<计算合并<X>>, A> {
    return 业务行为.通过实现构造(async (参数) => {
      let 所有结果 = await Promise.all(arr.map((a) => a.业务行为实现(参数)))
      let 错误 = 所有结果.filter((a) => a.isLeft())[0] ?? null
      if (错误 !== null) return 错误
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      let 正确结果合并 = 所有结果.map((a) => a.assertRight().getRight()).reduce((s, a) => ({ ...s, ...a }), {})
      return new Right(await f(正确结果合并))
    })
  }

  // ================================= 私有 =================================
  protected declare _业务行为实现_不变标注?: (参数: 参数类型) => Promise<Either<错误类型, 返回类型>>
  protected abstract 业务行为实现(参数: 参数类型): Promise<Either<错误类型, 返回类型>>

  // ================================= 设置 =================================
  public 设置参数<A extends Partial<参数类型>>(设置参数: A): 业务行为<Omit<参数类型, keyof A>, 错误类型, 返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      return await this.业务行为实现({ ...设置参数, ...参数 } as any)
    })
  }

  // ================================= 运行 =================================

  /**
   * 运行业务行为, 如果抛出错误, 则原封不动向上抛出
   */
  public async 运行业务行为(参数: 参数类型): Promise<Either<错误类型, 返回类型>> {
    return await this.业务行为实现(参数)
  }

  /**
   * 运行业务行为, 如果抛出错误, 则将错误值强制转换为字符串, 并包装为Error抛出
   */
  public async 运行业务行为并包装(参数: 参数类型): Promise<Either<错误类型, 返回类型>> {
    try {
      return await this.业务行为实现(参数)
    } catch (e) {
      throw new Error(String(e))
    }
  }

  // ================================= 组合 =================================
  /**
   * 将两个行为串接, 得到一个新行为, 新行为的类型是:
   * - 参数: a行为的参数
   * - 错误: a行为的错误+b行为的错误
   * - 返回值: b行为的返回值
   */
  public 流式组合<B错误类型 extends 业务行为错误类型, B返回类型 extends 业务行为返回类型>(
    b: 业务行为<返回类型, B错误类型, B返回类型>,
  ): 业务行为<参数类型, 错误类型 | B错误类型, B返回类型> {
    return 业务行为.通过实现构造(async (参数): Promise<Either<错误类型 | B错误类型, B返回类型>> => {
      let 我的结果 = await this.业务行为实现(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft())
      return b.业务行为实现(我的结果.assertRight().getRight())
    })
  }

  /**
   * 将两个行为串接, 得到一个新的行为
   * 相比流式组合, 本函数不要求串联位置参数匹配, 缺少的参数将在调用时补全
   * 新行为的类型是:
   * - 参数: a行为的参数+(b行为的参数-a行为的返回值)
   * - 错误: a行为的错误+b行为的错误
   * - 返回值: a行为的返回值+b行为的返回值
   */
  public 混合组合<
    B参数类型 extends 业务行为参数类型,
    B错误类型 extends 业务行为错误类型,
    B返回类型 extends 业务行为返回类型,
  >(
    b: 业务行为<B参数类型, B错误类型, B返回类型>,
  ): 计算混合组合<参数类型, 错误类型, 返回类型, B参数类型, B错误类型, B返回类型> {
    return 业务行为.通过实现构造(async (参数): Promise<Either<错误类型 | B错误类型, 返回类型 & B返回类型>> => {
      let 我的结果 = await this.业务行为实现(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft())
      let 对方结果 = await b.业务行为实现({ ...参数, ...我的结果.assertRight().getRight() } as any)
      return 对方结果.map((a) => ({ ...a, ...我的结果.assertRight().getRight() }))
    })
  }

  // ================================= 映射 =================================
  public 映射结果<新返回类型 extends 业务行为返回类型>(
    f: (a: 返回类型) => 新返回类型,
  ): 业务行为<参数类型, 错误类型, 新返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      let 我的结果 = await this.业务行为实现(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft())
      return Either.pure(f(我的结果.assertRight().getRight()))
    })
  }
  public 映射错误<新错误类型 extends 业务行为错误类型>(
    f: (a: 错误类型) => 新错误类型,
  ): 业务行为<参数类型, 新错误类型, 返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      let 我的结果 = await this.业务行为实现(参数)
      if (我的结果.isLeft()) return new Left(f(我的结果.assertLeft().getLeft()))
      return Either.pure(我的结果.assertRight().getRight())
    })
  }

  /**
   * 产生一个代数效应, 在效应中执行当前业务行为, 然后将其正确结果映射为新业务行为
   * 新行为的类型是:
   * - 参数: 必须是已有行为的参数的扩展, 因为调用时必须先调用已有行为
   * - 错误: 已有行为的错误+自定义错误, 因为调用已有行为时可能出错
   * - 返回值: 自定义数据
   */
  public 绑定<
    新参数类型 extends 业务行为参数类型 & 参数类型,
    新错误类型 extends 错误类型 | 业务行为错误类型,
    新返回类型 extends 业务行为返回类型,
  >(f: (a: 返回类型) => 业务行为<新参数类型, 新错误类型, 新返回类型>): 业务行为<新参数类型, 新错误类型, 新返回类型> {
    return 业务行为.通过实现构造(async (参数) => {
      let 我的结果 = await this.业务行为实现(参数)
      if (我的结果.isLeft()) return new Left(我的结果.assertLeft().getLeft() as 新错误类型)
      return f(我的结果.assertRight().getRight()).业务行为实现(参数)
    })
  }
}
