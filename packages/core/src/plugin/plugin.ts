import type { Request, Response } from 'express'
import type { z } from 'zod'
import type { 接口逻辑 } from '../interface/interface-logic'
import { 请求附加参数类型 } from '../server/server'

/**
 * ### 插件
 *
 * 插件是 {@link 接口逻辑} 的一部分, 是"业务逻辑"的前置逻辑
 * - 可以获得原始的req, res对象, 但res对象仅仅是为了兼容express的某些插件添加的, 不要使用res返回数据
 * - 插件的定位是, 从HTTP上下文中获得信息, 使后续逻辑能正确运行
 *   - 插件提供的信息是必要的, 如果插件无法获取到信息, 意味着这个请求是不合法的, 不会进入后续逻辑中
 *   - 所以插件不提供错误处理能力, 推荐直接抛出错误, 此时, 客户端会收到兜底错误500, 服务器日志会显示错误信息
 */
export class 插件<Obj extends z.AnyZodObject> {
  declare protected readonly __类型保持符号?: Obj

  public constructor(
    private 类型: Obj,
    private 实现: (req: Request, res: Response, 附加参数: 请求附加参数类型) => Promise<z.infer<Obj>>,
  ) {}

  public 获得类型(): Obj {
    return this.类型
  }

  public 运行(req: Request, res: Response, 附加参数: 请求附加参数类型): Promise<z.infer<Obj>> {
    return this.实现(req, res, 附加参数)
  }
}

export type 任意插件 = 插件<any>
export type 插件项类型 = 插件<z.AnyZodObject>
export type 取插件内部类型<A> = A extends 插件<infer x> ? x : never
export type 取插件内部ts类型<A> = A extends 插件<infer x> ? z.infer<x> : never

export type 合并插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? z.infer<取插件内部类型<插件项>> & 合并插件结果<xs>
        : {}
      : {}
    : {}
