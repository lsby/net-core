import type { z } from 'zod'
import { 类型保持符号 } from '../types/type-hold'
import type { 插件 } from './plug'

export class 接口类型<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件<z.AnyZodObject>>,
  正确结果类型 extends z.ZodTypeAny,
  错误结果类型 extends z.ZodTypeAny,
> {
  declare [类型保持符号]: [路径, 方法, 插件们, 正确结果类型, 错误结果类型]

  constructor(
    private 路径: 路径,
    private 方法: 方法,
    private 插件们: [...插件们],
    private 正确结果: 正确结果类型,
    private 错误结果: 错误结果类型,
  ) {}

  获得路径(): 路径 {
    return this.路径
  }

  获得方法(): 方法 {
    return this.方法
  }

  获得插件们(): [...插件们] {
    return this.插件们
  }

  获得正确结果类型(): 正确结果类型 {
    return this.正确结果
  }

  获得错误结果类型(): 错误结果类型 {
    return this.错误结果
  }
}

export type 任意接口类型 = 接口类型<any, any, any, any, any>
