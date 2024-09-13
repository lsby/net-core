import { z } from 'zod'
import { Either, Left, Right } from '@lsby/ts-fp-data'
import { 插件项类型 } from '../interface/plug'
import { 接口类型抽象类, 接口类型正确结果, 接口类型错误结果 } from '../interface/type/interface-type-abstract'
import { JSON接口基类 } from './api-json-base'

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
type 取返回类型<A> = A extends 包装的接口类型抽象类<any, any, any, infer X, any> ? X : never
type 取错误类型<A> = A extends 包装的接口类型抽象类<any, any, any, any, infer X> ? X : never

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

export abstract class JSON接口包装基类<接口类型描述 extends 任意的包装的接口类型> extends JSON接口基类<接口类型描述> {
  protected 构造正确返回(
    data: z.infer<取返回类型<接口类型描述>>,
  ): Either<z.infer<接口类型错误结果<接口类型描述>>, z.infer<接口类型正确结果<接口类型描述>>> {
    return new Right({ status: 'success' as const, data })
  }
  protected 构造错误返回(
    data: z.infer<取错误类型<接口类型描述>>,
  ): Either<z.infer<接口类型错误结果<接口类型描述>>, z.infer<接口类型正确结果<接口类型描述>>> {
    return new Left({ status: 'fail' as const, data })
  }
  protected 构造包装返回(
    data: Either<z.infer<取错误类型<接口类型描述>>, z.infer<取返回类型<接口类型描述>>>,
  ): Either<z.infer<接口类型错误结果<接口类型描述>>, z.infer<接口类型正确结果<接口类型描述>>> {
    if (data.isLeft()) return new Left({ status: 'fail' as const, data: data.assertLeft().getLeft() })
    return new Right({ status: 'success' as const, data: data.assertRight().getRight() })
  }
}
