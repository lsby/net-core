import { Either } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { 接口逻辑正确类型, 接口逻辑错误类型 } from './interface-logic'

/**
 * 描述接口逻辑返回的数据将以何种形式返回给前端.
 */
export abstract class 结果转换器<
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends 接口逻辑正确类型,
  接口错误类型,
  接口正确类型,
> {
  declare protected readonly __类型保持符号?: [实现错误类型, 实现正确类型, 接口错误类型, 接口正确类型]

  public abstract 获得接口错误形式Zod(): z.ZodTypeAny
  public abstract 获得接口正确形式Zod(): z.ZodTypeAny
  public abstract 实现(数据: Either<实现错误类型, 实现正确类型>): 接口错误类型 | 接口正确类型
}

export type 任意接口结果转换器 = 结果转换器<any, any, any, any>
export type 获得结果转换器实现错误类型<A> = A extends 结果转换器<infer X, any, any, any> ? X : never
export type 获得结果转换器实现正确类型<A> = A extends 结果转换器<any, infer X, any, any> ? X : never
export type 获得结果转换器接口错误类型<A> = A extends 结果转换器<any, any, infer X, any> ? X : never
export type 获得结果转换器接口正确类型<A> = A extends 结果转换器<any, any, any, infer X> ? X : never

/**
 * 常用结果转换器
 *
 * 将业务逻辑返回的 Either<错误, 成功> 转换为前端友好的统一格式:
 * - 成功时: { status: 'success', data: ... }
 * - 失败时: { status: 'fail', data: ... }
 *
 * 这种格式让前端可以通过 status 字段统一判断请求是否成功
 */
export class 常用结果转换器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodTypeAny,
> extends 结果转换器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  { status: 'fail'; data: z.infer<实现错误类型Zod> },
  { status: 'success'; data: z.infer<实现正确类型Zod> }
> {
  public constructor(
    private 实现错误类型Zod: 实现错误类型Zod,
    private 实现正确类型Zod: 实现正确类型Zod,
  ) {
    super()
  }

  public override 获得接口错误形式Zod(): z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 实现错误类型Zod }> {
    return z.object({ status: z.literal('fail'), data: this.实现错误类型Zod })
  }
  public override 获得接口正确形式Zod(): z.ZodObject<{ status: z.ZodLiteral<'success'>; data: 实现正确类型Zod }> {
    return z.object({ status: z.literal('success'), data: this.实现正确类型Zod })
  }
  public override 实现(
    数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
  ): { status: 'fail'; data: z.infer<实现错误类型Zod> } | { status: 'success'; data: z.infer<实现正确类型Zod> } {
    switch (数据.getTag()) {
      case 'Left': {
        return { status: 'fail', data: 数据.assertLeft().getLeft() }
      }
      case 'Right': {
        return { status: 'success', data: 数据.assertRight().getRight() }
      }
    }
  }
}

/**
 * 直接结果转换器
 *
 * 将业务逻辑返回的 Either<错误, {data: ...}> 转换为直接格式:
 * - 成功时: 直接的 data 内容
 * - 失败时: { status: 'fail', data: ... }
 *
 * 用于需要直接返回的场景:
 * - 因为接口逻辑需要组合, 所以返回值必须是对象, 但有时候需要返回一个非对象数据
 * - 这个转换器就约定了一个模式, 用于返回直接结果
 * - 业务逻辑需要返回 Either<错误, 成功>, 其中成功部分必须是 { data: 真正的返回值 }
 * - 如果返回左值，返回标准错误格式 { status: 'fail', data: ... }
 * - 如果返回右值，直接返回 data 部分
 *
 * 典型应用场景:
 * - 文件下载: 直接返回文件流
 * - 图片/视频: 直接返回二进制数据
 * - SSE/WebSocket: 建立长连接
 */
export class 直接结果转换器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodObject<{ data: z.ZodTypeAny }>,
> extends 结果转换器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  { status: 'fail'; data: z.infer<实现错误类型Zod> },
  z.infer<实现正确类型Zod>['data']
> {
  public constructor(
    private 实现错误类型Zod: 实现错误类型Zod,
    private 实现正确类型Zod: 实现正确类型Zod,
  ) {
    super()
  }

  public override 获得接口错误形式Zod(): z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 实现错误类型Zod }> {
    return z.object({ status: z.literal('fail'), data: this.实现错误类型Zod })
  }
  public override 获得接口正确形式Zod(): z.ZodTypeAny {
    return this.实现正确类型Zod.shape.data
  }
  public override 实现(
    数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
  ): { status: 'fail'; data: z.infer<实现错误类型Zod> } | z.infer<实现正确类型Zod> {
    switch (数据.getTag()) {
      case 'Left': {
        return { status: 'fail', data: 数据.assertLeft().getLeft() }
      }
      case 'Right': {
        return 数据.assertRight().getRight().data
      }
    }
  }
}
