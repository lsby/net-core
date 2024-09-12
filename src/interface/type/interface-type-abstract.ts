import type { z } from 'zod'
import { 插件项类型 } from '../plug'

export type 接口类型路径<A> =
  A extends 接口类型抽象类<infer A1, infer _A2, infer _A3, infer _A4, infer _A5> ? A1 : never
export type 接口类型方法<A> =
  A extends 接口类型抽象类<infer _A1, infer A2, infer _A3, infer _A4, infer _A5> ? A2 : never
export type 接口类型插件们<A> =
  A extends 接口类型抽象类<infer _A1, infer _A2, infer A3, infer _A4, infer _A5> ? A3 : never
export type 接口类型正确结果<A> =
  A extends 接口类型抽象类<infer _A1, infer _A2, infer _A3, infer A4, infer _A5> ? A4 : never
export type 接口类型错误结果<A> =
  A extends 接口类型抽象类<infer _A1, infer _A2, infer _A3, infer _A4, infer A5> ? A5 : never

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
