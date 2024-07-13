import type { z } from 'zod'
import type { 正确结果, 错误结果 } from '../result/result'
import type { 接口类型 } from './interface-type'
import { 合并插件结果, 插件项类型 } from './plug'

export class 接口<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确返回类型 extends z.ZodTypeAny,
  错误返回类型 extends z.ZodTypeAny,
> {
  constructor(
    private 接口类型: 接口类型<路径, 方法, 插件们, 正确返回类型, 错误返回类型>,
    private 实现: (
      插件结果: 合并插件结果<插件们>,
    ) => Promise<正确结果<z.infer<正确返回类型>> | 错误结果<z.infer<错误返回类型>>>,
  ) {}

  获得类型(): typeof this.接口类型 {
    return this.接口类型
  }

  获得实现(): typeof this.实现 {
    return this.实现
  }
}

export type 任意接口 = 接口<any, any, any, any, any>
