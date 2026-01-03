import type { Request, Response } from 'express'
import type { z } from 'zod'
import { 请求附加参数类型 } from '../server/server'

/**
 * 类似express中的中间件, 做一些前置过程, 例如解析参数, 解析文件等.
 *
 * 可以被注入在"接口逻辑"中, 为其提供前置数据.
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
