import { 测试 } from './test'

export abstract class 测试抽象类 extends 测试 {
  abstract override 前置: () => Promise<void>
  abstract override 中置: () => Promise<object>
  abstract override 后置: (中置结果: object) => Promise<void>

  constructor() {
    super(null as any, null as any, null as any, null as any)
  }
}
