export class 接口测试 {
  constructor(
    private 前置实现: () => Promise<void>,
    private 中置实现: () => Promise<object>,
    private 后置实现: (中置结果: object) => Promise<void>,
  ) {}

  async 运行(): Promise<void> {
    await this.前置实现()
    let 中置结果 = await this.中置实现()
    await this.后置实现(中置结果)
  }
}
