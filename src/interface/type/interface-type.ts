import type { z } from 'zod'
import { 插件项类型 } from '../plug'
import { 接口类型抽象类 } from './interface-type-abstract'

export class 接口类型<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确结果类型 extends z.ZodTypeAny,
  错误结果类型 extends z.ZodTypeAny,
> extends 接口类型抽象类<路径, 方法, 插件们, 正确结果类型, 错误结果类型> {
  protected declare readonly __类型保持符号?: [路径, 方法, 插件们, 正确结果类型, 错误结果类型]
  constructor(
    private 路径: 路径,
    private 方法: 方法,
    private 插件们: [...插件们],
    private 正确结果: 正确结果类型,
    private 错误结果: 错误结果类型,
  ) {
    super()
  }
  override 获得路径(): 路径 {
    return this.路径
  }
  override 获得方法(): 方法 {
    return this.方法
  }
  override 获得插件们(): [...插件们] {
    return this.插件们
  }
  override 获得正确结果类型(): 正确结果类型 {
    return this.正确结果
  }
  override 获得错误结果类型(): 错误结果类型 {
    return this.错误结果
  }
}
