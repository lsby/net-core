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

  abstract 实现(数据: Either<实现错误类型, 实现正确类型>): 接口错误形式 | 接口正确形式
}

export type 任意接口结果转换器 = 接口结果转换器<any, any, any, any>

export class 常用形式转换器<
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends 接口逻辑正确类型,
> extends 接口结果转换器<
  实现错误类型,
  实现正确类型,
  { status: 'fail'; data: 实现错误类型 },
  { status: 'success'; data: 实现正确类型 }
> {
  override 实现(
    数据: Either<实现错误类型, 实现正确类型>,
  ): { status: 'fail'; data: 实现错误类型 } | { status: 'success'; data: 实现正确类型 } {
    switch (数据.getTag()) {
      case 'Left': {
        return { status: 'fail', data: 数据.assertLeft().getLeft() }
      }
      case 'Right': {
        return { status: 'success', data: 数据.assertRight().getRight() }
      }
      default: {
        throw new Error('意外的数据标记')
      }
    }
  }
}

export class 常用延时直接形式转换器<
  实现最终返回类型,
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends { fn: () => 实现最终返回类型 },
> extends 接口结果转换器<实现错误类型, 实现正确类型, { status: 'fail'; data: 实现错误类型 }, 实现最终返回类型> {
  override 实现(数据: Either<实现错误类型, 实现正确类型>): { status: 'fail'; data: 实现错误类型 } | 实现最终返回类型 {
    switch (数据.getTag()) {
      case 'Left': {
        return { status: 'fail', data: 数据.assertLeft().getLeft() }
      }
      case 'Right': {
        return 数据.assertRight().getRight().fn()
      }
      default: {
        throw new Error('意外的数据标记')
      }
    }
  }
}
