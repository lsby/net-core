import { 测试 } from './test'

export abstract class 测试抽象类 extends 测试 {
  constructor() {
    super(null as any, null as any, null as any, null as any)

    this.前置 = this.前置实现
    this.中置 = this.中置实现
    this.后置 = this.后置实现
  }
  abstract 前置实现(): Promise<void>
  abstract 中置实现(): Promise<object>
  abstract 后置实现(中置结果: object): Promise<void>
}
