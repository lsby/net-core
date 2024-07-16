import { z } from 'zod'
import { 接口类型 } from '../interface/interface-type'
import { 插件项类型 } from '../interface/plug'
import { 正确JSON结果, 错误JSON结果 } from '../result/result'

export class 包装的接口类型<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确返回类型 extends z.ZodTypeAny,
  错误返回类型 extends z.ZodTypeAny,
> extends 接口类型<
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
  constructor(path: 路径, method: 方法, 插件们: [...插件们], 正确返回类型: 正确返回类型, 错误返回类型: 错误返回类型) {
    super(
      path,
      method,
      插件们,
      z.object({ status: z.literal('success'), data: 正确返回类型 }),
      z.object({ status: z.literal('fail'), data: 错误返回类型 }),
    )
  }
}
export class 包装的正确JSON结果<Data> extends 正确JSON结果<{
  status: 'success'
  data: Data
}> {
  constructor(data: Data) {
    super({
      status: 'success' as const,
      data,
    })
  }
}
export class 包装的错误JSON结果<Data> extends 错误JSON结果<{
  status: 'fail'
  data: Data
}> {
  constructor(data: Data) {
    super({
      status: 'fail' as const,
      data,
    })
  }
}
