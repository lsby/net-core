import { z } from 'zod'
import { API接口基类 } from '../interface/inst/interface-abstract'
import { 任意接口类型, 接口类型正确结果, 接口类型错误结果 } from '../interface/type/interface-type-abstract'
import { 正确JSON结果, 正确结果, 错误JSON结果, 错误结果 } from '../result/result'

export abstract class JSON接口基类<接口类型描述 extends 任意接口类型> extends API接口基类<接口类型描述> {
  protected override 包装正确结果(
    a: z.TypeOf<接口类型错误结果<接口类型描述>>,
  ): 正确结果<z.infer<接口类型正确结果<接口类型描述>>> {
    return new 正确JSON结果(a)
  }
  protected override 包装错误结果(
    a: z.TypeOf<接口类型正确结果<接口类型描述>>,
  ): 错误结果<z.infer<接口类型错误结果<接口类型描述>>> {
    return new 错误JSON结果(a)
  }
}
