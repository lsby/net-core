import type { Request, Response } from 'express'
import type { z } from 'zod'
import { 类型保持符号 } from '../types/type-hold'

export class 插件<Obj extends z.AnyZodObject> {
  declare [类型保持符号]: Obj

  constructor(
    private 类型: Obj,
    private 实现: (req: Request, res: Response) => Promise<z.infer<Obj>>,
  ) {}

  获得类型(): typeof this.类型 {
    return this.类型
  }

  获得实现(): typeof this.实现 {
    return this.实现
  }
}

export type 合并插件结果<Arr extends Array<插件<z.AnyZodObject>>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends 插件<infer obj>
      ? xs extends Array<插件<z.AnyZodObject>>
        ? z.infer<obj> & 合并插件结果<xs>
        : {}
      : {}
    : {}
