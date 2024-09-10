import type { Request, Response } from 'express'
import type { z } from 'zod'
import { Task } from '@lsby/ts-fp-data'

export class 插件<Obj extends z.AnyZodObject> {
  protected declare readonly __类型保持符号?: Obj

  constructor(
    private 类型: Obj,
    private 实现: (req: Request, res: Response) => Promise<z.infer<Obj>>,
  ) {}

  获得类型(): Obj {
    return this.类型
  }

  获得实现(): (req: Request, res: Response) => Promise<z.infer<Obj>> {
    return this.实现
  }
}

export type 任意插件 = 插件<any>
export type 包装插件项<A> = Task<A>
export type 插件项类型 = 包装插件项<插件<z.AnyZodObject>>
export type 取插件内部类型<A> = A extends Task<插件<infer x>> ? x : never

export type 合并插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? z.infer<取插件内部类型<插件项>> & 合并插件结果<xs>
        : {}
      : {}
    : {}
