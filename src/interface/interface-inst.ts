import { z } from 'zod'
import { 合并插件结果 } from '../plugin/plug'
import { 正确结果, 错误结果 } from '../result/result'
import { 任意接口类型, 接口类型插件们, 接口类型正确结果, 接口类型错误结果 } from './interface-type'

export type 计算接口参数<接口类型描述> = 合并插件结果<接口类型插件们<接口类型描述>>
export type 计算接口返回<接口类型描述> = Promise<
  正确结果<z.infer<接口类型正确结果<接口类型描述>>> | 错误结果<z.infer<接口类型错误结果<接口类型描述>>>
>

export abstract class 接口<接口类型描述 extends 任意接口类型> {
  abstract 获得接口类型(): 接口类型描述
  abstract 接口实现(参数: 计算接口参数<接口类型描述>): 计算接口返回<接口类型描述>
}

export type 任意接口 = 接口<any>
