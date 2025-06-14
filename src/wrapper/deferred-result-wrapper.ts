import { z } from 'zod'
import { 接口, 接口方法类型, 接口路径类型 } from '../interface/interface-base'
import { 接口逻辑, 获得接口逻辑正确类型, 获得接口逻辑错误类型 } from '../interface/interface-logic'
import { 常用延时直接形式转换器 } from '../interface/interface-result'

export class 常用延时直接形式接口封装<
  路径类型 extends 接口路径类型,
  方法类型 extends 接口方法类型,
  逻辑类型 extends 接口逻辑<any, Record<string, never>, z.infer<接口错误形式Zod>, () => z.infer<接口正确形式Zod>>,
  接口错误形式Zod extends z.ZodTypeAny,
  接口正确形式Zod extends z.ZodTypeAny,
> extends 接口<
  路径类型,
  方法类型,
  逻辑类型,
  z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 接口错误形式Zod }>,
  接口正确形式Zod,
  常用延时直接形式转换器<boolean, 获得接口逻辑错误类型<逻辑类型>, 获得接口逻辑正确类型<逻辑类型>>
> {
  constructor(
    请求路径: 路径类型,
    请求方法: 方法类型,
    接口逻辑: 逻辑类型,
    逻辑错误类型Zod: 接口错误形式Zod,
    逻辑正确类型Zod: 接口正确形式Zod,
  ) {
    let 接口错误输出形式 = z.object({ status: z.literal('fail'), data: 逻辑错误类型Zod })
    let 接口正确输出形式 = 逻辑正确类型Zod
    let 接口转换器 = new 常用延时直接形式转换器<
      boolean,
      获得接口逻辑错误类型<逻辑类型>,
      获得接口逻辑正确类型<逻辑类型>
    >()
    super(请求路径, 请求方法, 接口逻辑, 接口错误输出形式, 接口正确输出形式, 接口转换器)
  }
}
