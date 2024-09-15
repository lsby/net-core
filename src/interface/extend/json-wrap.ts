import { z } from 'zod'
import { Either } from '@lsby/ts-fp-data'
import { 插件项类型 } from '../../plugin/plug'
import { 正确JSON结果, 正确结果, 错误JSON结果, 错误结果 } from '../../result/result'
import { 接口, 计算接口参数, 计算接口返回 } from '../interface-inst'
import { 接口类型, 接口类型正确结果, 接口类型错误结果 } from '../interface-type'

export class JSON状态接口类型<
  路径 extends string | null,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确结果类型 extends z.ZodTypeAny,
  错误结果类型 extends z.ZodTypeAny,
> extends 接口类型<
  路径,
  方法,
  插件们,
  z.ZodObject<{
    status: z.ZodLiteral<'success'>
    data: 正确结果类型
  }>,
  z.ZodObject<{
    status: z.ZodLiteral<'fail'>
    data: 错误结果类型
  }>
> {
  protected declare readonly ___类型保持符号?: [路径, 方法, 插件们, 正确结果类型, 错误结果类型]

  constructor(path: 路径, method: 方法, 插件们: [...插件们], 正确结果类型: 正确结果类型, 错误结果类型: 错误结果类型) {
    super(
      path,
      method,
      插件们,
      z.object({ status: z.literal('success'), data: 正确结果类型 }),
      z.object({ status: z.literal('fail'), data: 错误结果类型 }),
    )
  }
}
type 任意的JSON状态接口类型 = JSON状态接口类型<any, any, any, any, any>

export type 计算JSON状态接口返回<接口类型描述> = Promise<
  Either<z.infer<接口类型错误结果<接口类型描述>>['data'], z.infer<接口类型正确结果<接口类型描述>>['data']>
>

export abstract class JSON状态接口<接口类型描述 extends 任意的JSON状态接口类型> extends 接口<接口类型描述> {
  protected abstract override 业务行为实现(参数: 计算接口参数<接口类型描述>): 计算JSON状态接口返回<接口类型描述>
  override async 转换业务结果到接口结果(
    业务结果: 计算接口返回<接口类型描述>,
  ): Promise<正确结果<z.TypeOf<接口类型正确结果<接口类型描述>>> | 错误结果<z.TypeOf<接口类型错误结果<接口类型描述>>>> {
    var c = await 业务结果
    if (c.isLeft()) return new 错误JSON结果({ status: 'fail' as const, data: c.assertLeft().getLeft() })
    return new 正确JSON结果({ status: 'success' as const, data: c.assertRight().getRight() })
  }
}
