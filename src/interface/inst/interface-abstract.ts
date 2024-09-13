import { z } from 'zod'
import { Either } from '@lsby/ts-fp-data'
import { 正确结果, 错误结果 } from '../../result/result'
import { 业务行为 } from '../action/action'
import { 合并插件结果 } from '../plug'
import { 任意接口类型, 接口类型插件们, 接口类型正确结果, 接口类型错误结果 } from '../type/interface-type-abstract'

export type 计算实现参数<接口类型描述> = 合并插件结果<接口类型插件们<接口类型描述>>
export type 计算实现返回<接口类型描述> = Promise<
  Either<z.infer<接口类型错误结果<接口类型描述>>, z.infer<接口类型正确结果<接口类型描述>>>
>

export abstract class API接口基类<接口类型描述 extends 任意接口类型> extends 业务行为<
  计算实现参数<接口类型描述>,
  z.infer<接口类型错误结果<接口类型描述>>,
  z.infer<接口类型正确结果<接口类型描述>>
> {
  protected abstract override 业务行为实现(参数: 计算实现参数<接口类型描述>): 计算实现返回<接口类型描述>
  abstract 获得API类型(): 接口类型描述
  abstract API实现(
    参数: 计算实现参数<接口类型描述>,
  ): Promise<正确结果<z.infer<接口类型正确结果<接口类型描述>>> | 错误结果<z.infer<接口类型错误结果<接口类型描述>>>>
}

export type 任意接口 = API接口基类<any>
