export abstract class 接口测试 {
  constructor() {}

  abstract 前置实现(): Promise<void>
  abstract 中置实现(): Promise<object>
  abstract 后置实现(中置结果: object): Promise<void>

  async 运行(): Promise<void> {
    await this.前置实现()
    var 中置结果 = await this.中置实现()
    await this.后置实现(中置结果)
  }
}
