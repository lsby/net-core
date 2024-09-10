import { 任意接口类型 } from '../interface/type/interface-type-abstract'
import { 测试抽象类 } from './test-abstract'

export class 测试 extends 测试抽象类 {
  constructor(
    private 接口类型: 任意接口类型,
    protected 前置: () => Promise<void>,
    protected 中置: () => Promise<object>,
    protected 后置: (中置结果: object) => Promise<void>,
  ) {
    super()
  }

  override 前置实现(): Promise<void> {
    return this.前置()
  }
  override 中置实现(): Promise<object> {
    return this.中置()
  }
  override 后置实现(中置结果: object): Promise<void> {
    return this.后置(中置结果)
  }
}
