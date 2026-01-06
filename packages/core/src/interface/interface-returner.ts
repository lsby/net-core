import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 请求附加参数类型 } from '../server/server'
import type { 接口 } from './interface-base'
import type { 接口逻辑 } from './interface-logic'
import { 接口逻辑正确类型, 接口逻辑错误类型 } from './interface-logic'

/**
 * ### 接口返回器
 *
 * 接口返回器是 {@link 接口} 的组成部分
 *
 * 描述如何将 {@link 接口逻辑} 返回的Either值返回给客户端
 */
export abstract class 接口返回器<
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends 接口逻辑正确类型,
  接口错误类型Zod extends z.ZodTypeAny,
  接口正确类型Zod extends z.ZodTypeAny,
> {
  declare protected readonly __类型保持符号?: [实现错误类型, 实现正确类型, 接口错误类型Zod, 接口正确类型Zod]

  public abstract 获得接口错误形式Zod(): 接口错误类型Zod
  public abstract 获得接口正确形式Zod(): 接口正确类型Zod

  public abstract 实现(
    req: Request,
    res: Response,
    数据: Either<实现错误类型, 实现正确类型>,
    请求附加参数: 请求附加参数类型,
  ): void
}
export type 任意接口返回器 = 接口返回器<any, any, any, any>
export type 获得接口返回器实现错误类型<A> = A extends 接口返回器<infer X, any, any, any> ? X : never
export type 获得接口返回器实现正确类型<A> = A extends 接口返回器<any, infer X, any, any> ? X : never
export type 获得接口返回器接口错误类型<A> = A extends 接口返回器<any, any, infer X, any> ? z.infer<X> : never
export type 获得接口返回器接口正确类型<A> = A extends 接口返回器<any, any, any, infer X> ? z.infer<X> : never
