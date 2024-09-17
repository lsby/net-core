import { z } from 'zod'
import { 业务行为 } from '../../action/action'
import { 正确JSON结果, 错误JSON结果 } from '../../result/result'
import { 接口, 计算接口参数, 计算接口返回 } from '../interface-inst'
import { 任意接口类型, 接口类型正确结果, 接口类型错误结果 } from '../interface-type'

export class JSON接口<接口类型描述 extends 任意接口类型> extends 接口<接口类型描述> {
  constructor(
    private 接口类型描述: 接口类型描述,
    private 业务行为: 业务行为<
      计算接口参数<接口类型描述>,
      z.infer<接口类型错误结果<接口类型描述>>,
      z.infer<接口类型正确结果<接口类型描述>>
    >,
  ) {
    super()
  }

  override 获得接口类型(): 接口类型描述 {
    return this.接口类型描述
  }
  override async 接口实现(参数: 计算接口参数<接口类型描述>): 计算接口返回<接口类型描述> {
    var c = await this.业务行为.运行业务行为(参数)
    if (c.isLeft()) return new 错误JSON结果(c.assertLeft().getLeft())
    return new 正确JSON结果(c.assertRight().getRight())
  }
}
