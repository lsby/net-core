import { Either } from '@lsby/ts-fp-data'
import { 接口逻辑正确类型, 接口逻辑错误类型 } from './interface-logic'

/**
 * 描述接口逻辑返回的数据将以何种形式返回给前端.
 */
export abstract class 接口结果转换器<
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends 接口逻辑正确类型,
  接口错误形式,
  接口正确形式,
> {
  protected declare readonly __类型保持符号?: [实现错误类型, 实现正确类型, 接口错误形式, 接口正确形式]

  public abstract 实现(数据: Either<实现错误类型, 实现正确类型>): 接口错误形式 | 接口正确形式
}

export type 任意接口结果转换器 = 接口结果转换器<any, any, any, any>

/**
 * 常用形式转换器
 *
 * 将业务逻辑返回的 Either<错误, 成功> 转换为前端友好的统一格式:
 * - 成功时: { status: 'success', data: ... }
 * - 失败时: { status: 'fail', data: ... }
 *
 * 这种格式让前端可以通过 status 字段统一判断请求是否成功
 */
export class 常用形式转换器<
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends 接口逻辑正确类型,
> extends 接口结果转换器<
  实现错误类型,
  实现正确类型,
  { status: 'fail'; data: 实现错误类型 },
  { status: 'success'; data: 实现正确类型 }
> {
  public override 实现(
    数据: Either<实现错误类型, 实现正确类型>,
  ): { status: 'fail'; data: 实现错误类型 } | { status: 'success'; data: 实现正确类型 } {
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
 * 直接形式转换器
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
export class 直接形式转换器<
  实现最终返回类型,
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends { data: 实现最终返回类型 },
> extends 接口结果转换器<实现错误类型, 实现正确类型, { status: 'fail'; data: 实现错误类型 }, 实现最终返回类型> {
  public override 实现(
    数据: Either<实现错误类型, 实现正确类型>,
  ): { status: 'fail'; data: 实现错误类型 } | 实现最终返回类型 {
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
