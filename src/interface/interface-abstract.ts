import { z } from 'zod'
import { 正确结果, 错误结果 } from '../result/result'
import { 接口 } from './interface'
import { 接口类型 } from './interface-type'
import { 合并插件结果 } from './plug'

type F1<A> = A extends 接口类型<infer A1, infer _A2, infer _A3, infer _A4, infer _A5> ? A1 : never
type F2<A> = A extends 接口类型<infer _A1, infer A2, infer _A3, infer _A4, infer _A5> ? A2 : never
type F3<A> = A extends 接口类型<infer _A1, infer _A2, infer A3, infer _A4, infer _A5> ? A3 : never
type F4<A> = A extends 接口类型<infer _A1, infer _A2, infer _A3, infer A4, infer _A5> ? A4 : never
type F5<A> = A extends 接口类型<infer _A1, infer _A2, infer _A3, infer _A4, infer A5> ? A5 : never
export type 计算实现参数<接口类型定义> = 合并插件结果<F3<接口类型定义>>
export type 计算实现结果<接口类型定义> = Promise<
  正确结果<z.infer<F4<接口类型定义>>> | 错误结果<z.infer<F5<接口类型定义>>>
>

export abstract class 接口抽象类<接口类型描述 extends 接口类型<any, any, any, any, any>> extends 接口<
  F1<接口类型描述>,
  F2<接口类型描述>,
  F3<接口类型描述>,
  F4<接口类型描述>,
  F5<接口类型描述>
> {
  constructor() {
    super(null as any, null as any)
  }

  abstract override 获得类型(): 接口类型描述

  override 获得实现(): (
    ctx: object,
  ) => Promise<正确结果<z.infer<F4<接口类型描述>>> | 错误结果<z.infer<F5<接口类型描述>>>> {
    return this.调用 as any
  }

  abstract 调用(
    ctx: 合并插件结果<F3<接口类型描述>>,
  ): Promise<正确结果<z.infer<F4<接口类型描述>>> | 错误结果<z.infer<F5<接口类型描述>>>>
}
