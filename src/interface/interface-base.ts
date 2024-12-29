import { z } from 'zod'
import { 可调用接口逻辑, 获得接口逻辑正确类型, 获得接口逻辑错误类型 } from './interface-logic'
import { 接口结果转换器 } from './interface-result'

export type 接口路径类型 = string
export type 接口方法类型 = 'get' | 'post'

/**
 * 接口的描述.
 */
export class 接口<
  路径类型 extends 接口路径类型,
  方法类型 extends 接口方法类型,
  逻辑类型 extends 可调用接口逻辑,
  接口错误形式Zod extends z.ZodTypeAny,
  接口正确形式Zod extends z.ZodTypeAny,
  接口结果转换器类型 extends 接口结果转换器<
    获得接口逻辑错误类型<逻辑类型>,
    获得接口逻辑正确类型<逻辑类型>,
    z.infer<接口错误形式Zod>,
    z.infer<接口正确形式Zod>
  >,
> {
  protected declare readonly __类型保持符号?: [
    路径类型,
    方法类型,
    逻辑类型,
    接口错误形式Zod,
    接口正确形式Zod,
    接口结果转换器类型,
  ]

  constructor(
    private 请求路径: 路径类型,
    private 请求方法: 方法类型,
    private 接口逻辑: 逻辑类型,
    private 接口错误形式Zod: 接口错误形式Zod,
    private 接口正确形式Zod: 接口正确形式Zod,
    private 结果转换器: 接口结果转换器类型,
  ) {}

  获得路径(): 路径类型 {
    return this.请求路径
  }
  获得方法(): 方法类型 {
    return this.请求方法
  }
  获得逻辑(): 逻辑类型 {
    return this.接口逻辑
  }
  获得接口错误形式Zod(): 接口错误形式Zod {
    return this.接口错误形式Zod
  }
  获得接口正确形式Zod(): 接口正确形式Zod {
    return this.接口正确形式Zod
  }
  获得结果转换器(): 接口结果转换器类型 {
    return this.结果转换器
  }
}

export type 任意接口 = 接口<any, any, any, any, any, any>
export type 获得接口路径类型<A> = A extends 接口<infer X, any, any, any, any, any> ? X : never
export type 获得接口方法类型<A> = A extends 接口<any, infer X, any, any, any, any> ? X : never
export type 获得接口逻辑类型<A> = A extends 接口<any, any, infer X, any, any, any> ? X : never
export type 获得接口错误形式<A> = A extends 接口<any, any, any, infer X, any, any> ? z.infer<X> : never
export type 获得接口正确形式<A> = A extends 接口<any, any, any, any, infer X, any> ? z.infer<X> : never
export type 获得接口结果转换器类型<A> = A extends 接口<any, any, any, any, any, infer X> ? X : never
