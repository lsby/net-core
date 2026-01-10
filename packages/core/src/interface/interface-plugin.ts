import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 请求附加参数类型 } from '../types/types'
import type { 接口逻辑 } from './interface-logic'

/**
 * ### 插件
 *
 * 插件是 {@link 接口逻辑} 的一部分, 是"业务逻辑"的前置逻辑
 * - 可以获得原始的req, res对象, 但res对象仅仅是为了兼容express的某些插件添加的, 不要使用res返回数据
 * - 插件的定位是, 从HTTP上下文中获得信息, 使后续逻辑能正确运行
 *   - 插件提供的信息是必要的, 如果插件无法获取到信息, 意味着接口逻辑不能正常运行
 *   - 插件提供错误处理能力, 可以在插件中返回左值来拒绝请求, 此时, 服务器会直接返回错误信息, 不会进入后续逻辑
 */
export class 插件<
  错误结果 extends z.ZodObject<{ code: z.ZodLiteral<any>; data: z.ZodTypeAny }> | z.ZodNever,
  正确结果 extends z.AnyZodObject,
> {
  declare protected readonly __类型保持符号?: [错误结果, 正确结果]

  public constructor(
    private 错误类型描述: 错误结果,
    private 正确类型描述: 正确结果,
    private 实现: (
      req: Request,
      res: Response,
      附加参数: 请求附加参数类型,
    ) => Promise<Either<z.infer<错误结果>, z.infer<正确结果>>>,
  ) {}

  public 获得错误类型描述(): 错误结果 {
    return this.错误类型描述
  }
  public 获得正确类型描述(): 正确结果 {
    return this.正确类型描述
  }

  public 运行(
    req: Request,
    res: Response,
    附加参数: 请求附加参数类型,
  ): Promise<Either<z.infer<错误结果>, z.infer<正确结果>>> {
    return this.实现(req, res, 附加参数)
  }
}

export type 任意插件 = 插件<any, any>

export type 取插件错误ts类型<A> = A extends 插件<infer x, any> ? z.infer<x> : never
export type 取插件正确ts类型<A> = A extends 插件<any, infer x> ? z.infer<x> : never

export type 合并插件正确结果<Arr extends Array<任意插件>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<任意插件>
        ? 取插件正确ts类型<插件项> & 合并插件正确结果<xs>
        : {}
      : {}
    : {}
