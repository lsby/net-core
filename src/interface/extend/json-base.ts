import { z } from 'zod'
import { 正确JSON结果, 正确结果, 错误JSON结果, 错误结果 } from '../../result/result'
import { 接口, 计算接口返回 } from '../interface-inst'
import { 任意接口类型, 接口类型正确结果, 接口类型错误结果 } from '../interface-type'

export abstract class JSON接口<接口类型描述 extends 任意接口类型> extends 接口<接口类型描述> {
  override async 转换业务结果到接口结果(
    业务结果: 计算接口返回<接口类型描述>,
  ): Promise<正确结果<z.TypeOf<接口类型正确结果<接口类型描述>>> | 错误结果<z.TypeOf<接口类型错误结果<接口类型描述>>>> {
    var c = await 业务结果
    if (c.isLeft()) return new 错误JSON结果(c.assertLeft().getLeft())
    return new 正确JSON结果(c.assertRight().getRight())
  }
}
