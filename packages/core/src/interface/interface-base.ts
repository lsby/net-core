import { 空对象 } from '../types/types'
import { 接口逻辑, 接口逻辑Base } from './interface-logic'
import {
  任意接口返回器,
  接口返回器,
  获得接口返回器实现正确类型,
  获得接口返回器实现错误类型,
} from './interface-returner'

export type 接口路径类型 = string | RegExp
export type 接口方法类型 = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'

/**
 * ### 接口
 *
 * 一个HTTP接口, 它由以下部分组成:
 * - 请求路径: 例如 /api/xxx 或正则表达式 /^\/api\/.+/
 * - 请求方法: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'
 * - 接口逻辑: 接口的实际逻辑行为, 见 {@link 接口逻辑}
 * - 接口返回器: 决定如何将接口逻辑的返回值返回给客户端的逻辑, 见 {@link 接口返回器}
 *
 * 推荐将接口作为文件的默认导出, 这样可以让类型工具对齐进行静态分析, 生成索引和类型
 */
export class 接口<
  路径类型 extends 接口路径类型,
  方法类型 extends 接口方法类型,
  接口逻辑类型 extends 接口逻辑Base<
    any,
    空对象,
    获得接口返回器实现错误类型<接口返回器类型>,
    获得接口返回器实现正确类型<接口返回器类型>,
    any,
    any
  >,
  接口返回器类型 extends 任意接口返回器,
> {
  declare protected readonly __类型保持符号?: [路径类型, 方法类型, 接口逻辑类型, 接口返回器类型]

  public constructor(
    private 请求路径: 路径类型,
    private 请求方法: 方法类型,
    private 接口逻辑: 接口逻辑类型,
    private 接口返回器: 接口返回器类型,
  ) {}

  public 获得路径(): 路径类型 {
    return this.请求路径
  }

  public 匹配路径(路径: string): boolean {
    let 规则 = this.请求路径
    if (typeof 规则 === 'string') {
      return 规则 === 路径
    }
    if (规则 instanceof RegExp) {
      return 规则.test(路径)
    }
    return false
  }

  public 获得方法(): 方法类型 {
    return this.请求方法
  }
  public 获得接口逻辑(): 接口逻辑类型 {
    return this.接口逻辑
  }
  public 获得接口返回器(): 接口返回器类型 {
    return this.接口返回器
  }
}

export type 任意接口 = 接口<any, any, any, any>
export type 获得接口路径类型<A> = A extends 接口<infer X, any, any, any> ? X : never
export type 获得接口方法类型<A> = A extends 接口<any, infer X, any, any> ? X : never
export type 获得接口逻辑类型<A> = A extends 接口<any, any, infer X, any> ? X : never
export type 获得接口返回器类型<A> = A extends 接口<any, any, any, infer X> ? X : never
