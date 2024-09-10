import { z } from 'zod'
import { 正确结果, 错误结果 } from '../../result/result'
import { 合并插件结果 } from '../plug'
import { 任意接口类型, 接口类型抽象类 } from '../type/interface-type-abstract'

type _F1<A> = A extends 接口类型抽象类<infer A1, infer _A2, infer _A3, infer _A4, infer _A5> ? A1 : never
type _F2<A> = A extends 接口类型抽象类<infer _A1, infer A2, infer _A3, infer _A4, infer _A5> ? A2 : never
type F3<A> = A extends 接口类型抽象类<infer _A1, infer _A2, infer A3, infer _A4, infer _A5> ? A3 : never
type F4<A> = A extends 接口类型抽象类<infer _A1, infer _A2, infer _A3, infer A4, infer _A5> ? A4 : never
type F5<A> = A extends 接口类型抽象类<infer _A1, infer _A2, infer _A3, infer _A4, infer A5> ? A5 : never
export type 计算实现参数<接口类型定义> = 合并插件结果<F3<接口类型定义>>
export type 计算实现结果<接口类型定义> = Promise<
  正确结果<z.infer<F4<接口类型定义>>> | 错误结果<z.infer<F5<接口类型定义>>>
>

export abstract class 接口抽象类<接口类型描述 extends 任意接口类型> {
  abstract 获得类型(): 接口类型描述
  abstract 调用(
    ctx: 合并插件结果<F3<接口类型描述>>,
  ): Promise<正确结果<z.infer<F4<接口类型描述>>> | 错误结果<z.infer<F5<接口类型描述>>>>
}

export interface API接口<接口类型描述 extends 任意接口类型> {
  获得类型(): 接口类型描述
  调用(
    ctx: 合并插件结果<F3<接口类型描述>>,
  ): Promise<正确结果<z.infer<F4<接口类型描述>>> | 错误结果<z.infer<F5<接口类型描述>>>>
}

export type 任意接口 = 接口抽象类<any>
