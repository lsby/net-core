import { Task } from '@lsby/ts-fp-data'
import { 任意接口 } from '../interface/interface'

export class 测试<接口类型 extends 任意接口> {
  constructor(
    private 接口类型: 接口类型,
    private 前置: Task<void>,
    private 中置: Task<object>,
    private 后置: (中置结果: object) => Task<void>,
  ) {}

  async 运行(): Promise<void> {
    await this.前置.run()
    var 中置结果 = await this.中置.run()
    await this.后置(中置结果).run()
  }
}
