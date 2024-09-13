import { z } from 'zod'
import { API接口基类 } from '../interface/inst/interface-abstract'
import { 合并插件结果 } from '../interface/plug'
import {
  任意接口类型,
  接口类型插件们,
  接口类型正确结果,
  接口类型错误结果,
} from '../interface/type/interface-type-abstract'
import { 正确JSON结果, 正确结果, 错误JSON结果, 错误结果 } from '../result/result'

export abstract class JSON接口基类<接口类型描述 extends 任意接口类型> extends API接口基类<接口类型描述> {
  override async API实现(
    参数: 合并插件结果<接口类型插件们<接口类型描述>>,
  ): Promise<正确结果<z.infer<接口类型正确结果<接口类型描述>>> | 错误结果<z.infer<接口类型错误结果<接口类型描述>>>> {
    var 业务结果 = await this.业务行为实现(参数)
    if (业务结果.isLeft()) return new 错误JSON结果(业务结果.assertLeft().getLeft())
    return new 正确JSON结果(业务结果.assertRight().getRight())
  }
}
