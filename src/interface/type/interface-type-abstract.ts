import type { z } from 'zod'
import { 插件项类型 } from '../plug'

export abstract class 接口类型抽象类<
  路径 extends string,
  方法 extends 'get' | 'post',
  插件们 extends Array<插件项类型>,
  正确结果类型 extends z.ZodTypeAny,
  错误结果类型 extends z.ZodTypeAny,
> {
  abstract 获得路径(): 路径
  abstract 获得方法(): 方法
  abstract 获得插件们(): [...插件们]
  abstract 获得正确结果类型(): 正确结果类型
  abstract 获得错误结果类型(): 错误结果类型
}
export type 任意接口类型 = 接口类型抽象类<any, any, any, any, any>
export type 获得接口插件们<接口类型描述> =
  接口类型描述 extends 接口类型抽象类<any, any, infer 插件, any, any> ? 插件 : never
