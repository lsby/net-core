import type { z } from 'zod'
import type { 正确结果, 错误结果 } from '../../result/result'
import { 合并插件结果, 插件项类型 } from '../plug'
import { 接口类型抽象类 } from '../type/interface-type-abstract'
import { API接口基类 } from './interface-abstract'

export class 接口<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确返回类型 extends z.ZodTypeAny,
  错误返回类型 extends z.ZodTypeAny,
> extends API接口基类<接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>> {
  protected declare readonly __类型保持符号?: [路径, 方法, 插件们, 正确返回类型, 错误返回类型]
  constructor(
    private 接口类型: 接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>,
    private 实现: (
      插件结果: 合并插件结果<插件们>,
    ) => Promise<正确结果<z.infer<正确返回类型>> | 错误结果<z.infer<错误返回类型>>>,
  ) {
    super()
  }

  override 获得API类型(): 接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型> {
    return this.接口类型
  }

  override API实现(
    ctx: 合并插件结果<插件们>,
  ): Promise<正确结果<z.TypeOf<正确返回类型>> | 错误结果<z.TypeOf<错误返回类型>>> {
    return this.实现(ctx)
  }
}
