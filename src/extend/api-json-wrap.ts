import { z } from 'zod'
import { Either } from '@lsby/ts-fp-data'
import { API接口基类, 计算实现参数 } from '../interface/inst/interface-abstract'
import { 合并插件结果, 插件项类型 } from '../interface/plug'
import {
  接口类型抽象类,
  接口类型插件们,
  接口类型正确结果,
  接口类型错误结果,
} from '../interface/type/interface-type-abstract'
import { 正确JSON结果, 正确结果, 错误JSON结果, 错误结果 } from '../result/result'

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
type 任意的包装的接口类型 = 包装的接口类型抽象类<any, any, any, any, any>

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

export abstract class JSON接口包装基类<接口类型描述 extends 任意的包装的接口类型> extends API接口基类<接口类型描述> {
  protected abstract override 业务行为实现(
    参数: 计算实现参数<接口类型描述>,
  ): Promise<Either<z.infer<接口类型错误结果<接口类型描述>>['data'], z.infer<接口类型正确结果<接口类型描述>>['data']>>
  override async API实现(
    参数: 合并插件结果<接口类型插件们<接口类型描述>>,
  ): Promise<正确结果<z.infer<接口类型正确结果<接口类型描述>>> | 错误结果<z.infer<接口类型错误结果<接口类型描述>>>> {
    var c = await this.业务行为实现(参数)
    if (c.isLeft()) return new 错误JSON结果({ status: 'fail' as const, data: c.assertLeft().getLeft() })
    return new 正确JSON结果({ status: 'success' as const, data: c.assertRight().getRight() })
  }
}
