import { 空对象 } from '../types/types'
import { 接口逻辑Base } from './interface-logic'
import {
  任意接口结果转换器,
  获得结果转换器实现正确类型,
  获得结果转换器实现错误类型,
  获得结果转换器接口正确类型,
  获得结果转换器接口错误类型,
} from './interface-result'
import { 任意接口结果返回器, 结果返回器 } from './interface-retuen'

export type 接口路径类型 = string
export type 接口方法类型 = 'get' | 'post'

/**
 * 接口的描述.
 */
export class 接口<
  路径类型 extends 接口路径类型,
  方法类型 extends 接口方法类型,
  逻辑类型 extends 接口逻辑Base<
    any,
    空对象,
    获得结果转换器实现错误类型<接口结果转换器类型>,
    获得结果转换器实现正确类型<接口结果转换器类型>,
    any,
    any
  >,
  接口结果转换器类型 extends 任意接口结果转换器,
> {
  declare protected readonly __类型保持符号?: [路径类型, 方法类型, 逻辑类型, 接口结果转换器类型]

  public constructor(
    private 请求路径: 路径类型,
    private 请求方法: 方法类型,
    private 接口逻辑: 逻辑类型,
    private 结果转换器: 接口结果转换器类型,
    // 为了让类型补全工作, 这里不能用泛型, 而是要直接描述参数类型
    private 结果返回器: 结果返回器<
      获得结果转换器接口错误类型<接口结果转换器类型> | 获得结果转换器接口正确类型<接口结果转换器类型>
    >,
  ) {}

  public 获得路径(): 路径类型 {
    return this.请求路径
  }
  public 获得方法(): 方法类型 {
    return this.请求方法
  }
  public 获得逻辑(): 逻辑类型 {
    return this.接口逻辑
  }
  public 获得结果转换器(): 任意接口结果转换器 {
    return this.结果转换器
  }
  public 获得结果返回器(): 任意接口结果返回器 {
    return this.结果返回器
  }
}

export type 任意接口 = 接口<any, any, any, any>
export type 获得接口路径类型<A> = A extends 接口<infer X, any, any, any> ? X : never
export type 获得接口方法类型<A> = A extends 接口<any, infer X, any, any> ? X : never
export type 获得接口逻辑类型<A> = A extends 接口<any, any, infer X, any> ? X : never
export type 获得接口结果转换器类型<A> = A extends 接口<any, any, any, infer X> ? X : never
