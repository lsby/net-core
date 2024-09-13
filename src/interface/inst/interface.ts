import type { z } from 'zod'
import { Either } from '@lsby/ts-fp-data'
import type { 正确结果, 错误结果 } from '../../result/result'
import { 合并插件结果, 插件项类型 } from '../plug'
import { 接口类型抽象类, 接口类型正确结果, 接口类型错误结果 } from '../type/interface-type-abstract'
import { API接口基类 } from './interface-abstract'

export class 接口<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确返回类型 extends z.ZodTypeAny,
  错误返回类型 extends z.ZodTypeAny,
> extends API接口基类<接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>> {
  constructor(
    private 接口类型: 接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>,
    private 正确结果包装器: (
      a: z.infer<接口类型错误结果<接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>>>,
    ) => 正确结果<z.infer<接口类型正确结果<接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>>>>,
    private 错误结果包装器: (
      a: z.infer<接口类型正确结果<接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>>>,
    ) => 错误结果<z.infer<接口类型错误结果<接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型>>>>,
    private 实现: (插件结果: 合并插件结果<插件们>) => Promise<Either<z.infer<错误返回类型>, z.infer<正确返回类型>>>,
  ) {
    super()
  }

  protected override 包装正确结果(a: z.infer<错误返回类型>): 正确结果<z.infer<正确返回类型>> {
    return this.正确结果包装器(a)
  }
  protected override 包装错误结果(a: z.infer<正确返回类型>): 错误结果<z.infer<错误返回类型>> {
    return this.错误结果包装器(a)
  }

  protected override 业务行为实现(
    参数: 合并插件结果<插件们>,
  ): Promise<Either<z.infer<错误返回类型>, z.infer<正确返回类型>>> {
    return this.实现(参数)
  }

  override 获得API类型(): 接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型> {
    return this.接口类型
  }
}
