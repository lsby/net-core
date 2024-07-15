import type { z } from 'zod'
import { 插件项类型 } from './plug'

export class 接口类型<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确结果类型 extends z.ZodTypeAny,
  错误结果类型 extends z.ZodTypeAny,
> {
  protected declare readonly __类型保持符号?: [路径, 方法, 插件们, 正确结果类型, 错误结果类型]

  constructor(
    private 路径: 路径,
    private 方法: 方法,
    private 插件们: [...插件们],
    private 正确结果: 正确结果类型,
    private 错误结果: 错误结果类型,
    private 优先级: number = 1,
  ) {}

  获得路径(): string {
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

  获得优先级(): number {
    return this.优先级
  }
}

export type 任意接口类型 = 接口类型<any, any, any, any, any>
export type 获得接口插件们<接口类型描述> = 接口类型描述 extends 接口类型<any, any, infer 插件, any, any> ? 插件 : never
