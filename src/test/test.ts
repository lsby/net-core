import { 任意接口类型 } from '../interface/interface-type'

export class 测试 {
  constructor(
    private 接口类型: 任意接口类型,
    private 前置: () => Promise<void>,
    private 中置: () => Promise<object>,
    private 后置: (中置结果: object) => Promise<void>,
  ) {}

  async 运行(): Promise<void> {
    await this.前置()
    var 中置结果 = await this.中置()
    await this.后置(中置结果)
  }
}
