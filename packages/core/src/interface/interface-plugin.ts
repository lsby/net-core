import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import type { z } from 'zod'
import { 插件执行失败结果, 请求附加参数类型 } from '../types/types'
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
export class 插件<ErrorData, Obj extends z.AnyZodObject> {
  declare protected readonly __类型保持符号?: [ErrorData, Obj]

  public constructor(
    private 类型: Obj,
    private 实现: (
      req: Request,
      res: Response,
      附加参数: 请求附加参数类型,
    ) => Promise<Either<插件执行失败结果<ErrorData>, z.infer<Obj>>>,
  ) {}

  public 获得类型(): Obj {
    return this.类型
  }

  public 运行(
    req: Request,
    res: Response,
    附加参数: 请求附加参数类型,
  ): Promise<Either<插件执行失败结果<ErrorData>, z.infer<Obj>>> {
    return this.实现(req, res, 附加参数)
  }
}

export type 任意插件 = 插件<any, any>
export type 插件项类型 = 插件<any, z.AnyZodObject>

export type 取插件错误类型<A> = A extends 插件<infer E, any> ? E : never
export type 取插件内部类型<A> = A extends 插件<any, infer x> ? x : never
export type 取插件内部ts类型<A> = A extends 插件<any, infer x> ? z.infer<x> : never

export type 取插件组错误联合类型<Arr extends Array<插件项类型>> = Arr[number] extends 插件<infer E, any> ? E : never

export type 合并插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? z.infer<取插件内部类型<插件项>> & 合并插件结果<xs>
        : {}
      : {}
    : {}
