import { z } from 'zod'
import { 业务行为 } from '../interface/action/action'
import { 计算实现参数, 计算实现返回 } from '../interface/inst/interface-abstract'
import { 合并插件结果 } from '../interface/plug'
import {
  任意接口类型,
  接口类型插件们,
  接口类型正确结果,
  接口类型错误结果,
} from '../interface/type/interface-type-abstract'
import { JSON接口基类 } from './api-json-base'

export abstract class JSON接口行为基类<接口类型描述 extends 任意接口类型> extends JSON接口基类<接口类型描述> {
  abstract 获得业务行为(): 业务行为<
    计算实现参数<接口类型描述>,
    z.infer<接口类型错误结果<接口类型描述>>,
    z.infer<接口类型正确结果<接口类型描述>>
  >
  protected override 业务行为实现(参数: 合并插件结果<接口类型插件们<接口类型描述>>): 计算实现返回<接口类型描述> {
    return this.获得业务行为().运行业务行为(参数)
  }
}
