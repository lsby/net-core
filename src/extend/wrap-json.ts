import { z } from 'zod'
import { 插件项类型 } from '../interface/plug'
import { 接口类型抽象类 } from '../interface/type/interface-type-abstract'
import { 正确JSON结果, 错误JSON结果 } from '../result/result'

export abstract class 包装的接口类型抽象类<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确返回类型 extends z.ZodTypeAny,
  错误返回类型 extends z.ZodTypeAny,
> extends 接口类型抽象类<
  路径,
  方法,
  插件们,
  z.ZodObject<{
    status: z.ZodLiteral<'success'>
    data: 正确返回类型
  }>,
  z.ZodObject<{
    status: z.ZodLiteral<'fail'>
    data: 错误返回类型
  }>
> {
  abstract override 获得路径(): 路径
  abstract override 获得方法(): 方法
  abstract override 获得插件们(): [...插件们]
  abstract override 获得正确结果类型(): z.ZodObject<{ status: z.ZodLiteral<'success'>; data: 正确返回类型 }>
  abstract override 获得错误结果类型(): z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 错误返回类型 }>
}

export class 包装的接口类型<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确返回类型 extends z.ZodTypeAny,
  错误返回类型 extends z.ZodTypeAny,
> extends 包装的接口类型抽象类<路径, 方法, 插件们, 正确返回类型, 错误返回类型> {
  constructor(
    private path: 路径,
    private method: 方法,
    private 插件们: [...插件们],
    private 正确返回类型: 正确返回类型,
    private 错误返回类型: 错误返回类型,
  ) {
    super()
  }

  override 获得路径(): 路径 {
    return this.path
  }
  override 获得方法(): 方法 {
    return this.method
  }
  override 获得插件们(): [...插件们] {
    return this.插件们
  }
  override 获得正确结果类型(): z.ZodObject<{ status: z.ZodLiteral<'success'>; data: 正确返回类型 }> {
    return z.object({ status: z.literal('success'), data: this.正确返回类型 })
  }
  override 获得错误结果类型(): z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 错误返回类型 }> {
    return z.object({ status: z.literal('fail'), data: this.错误返回类型 })
  }
}

export class 包装的正确JSON结果<Data> extends 正确JSON结果<{ status: 'success'; data: Data }> {
  constructor(data: Data) {
    super({
      status: 'success' as const,
      data,
    })
  }
}
export class 包装的错误JSON结果<Data> extends 错误JSON结果<{ status: 'fail'; data: Data }> {
  constructor(data: Data) {
    super({
      status: 'fail' as const,
      data,
    })
  }
}
