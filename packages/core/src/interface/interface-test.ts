import { 任意接口, 获得接口返回器类型 } from './interface-base'
import { 获得接口返回器接口正确类型, 获得接口返回器接口错误类型 } from './interface-returner'

export class 接口测试<接口类型 extends 任意接口, 预期类型 extends '成功' | '失败'> {
  public constructor(
    private 接口: 接口类型,
    private 预期: 预期类型,
    private 前置过程: () => Promise<void>,
    private 中置过程: () => Promise<object>,
    private 后置过程: (
      解析结果: 预期类型 extends '失败'
        ? 获得接口返回器接口错误类型<获得接口返回器类型<接口类型>>
        : 获得接口返回器接口正确类型<获得接口返回器类型<接口类型>>,
      中置结果: object,
    ) => Promise<void>,
  ) {}

  public async 运行(): Promise<void> {
    await this.前置过程()

    let 中置结果 = await this.中置过程()

    console.log('接口: %o, 实际结果: %o', this.接口.获得路径(), 中置结果)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let 失败结果校验 = this.接口.获得接口返回器().获得接口错误形式Zod().safeParse(中置结果)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let 正确结果校验 = this.接口.获得接口返回器().获得接口正确形式Zod().safeParse(中置结果)

    if (失败结果校验.success === false && 正确结果校验.success === false) {
      throw new Error('没有通过返回值检查')
    }
    if (正确结果校验.success === true) {
      console.log('预期: %o, 实际: %o', this.预期, '成功')
      if (this.预期 === '失败') throw new Error('应该调用失败, 实际调用成功')
    }
    if (失败结果校验.success === true) {
      console.log('预期: %o, 实际: %o', this.预期, '失败')
      if (this.预期 === '成功') throw new Error('应该调用成功, 实际调用出错')
    }

    await this.后置过程(this.预期 === '失败' ? 失败结果校验.data : 正确结果校验.data, 中置结果)
  }
}
export type 任意的接口测试 = 接口测试<any, any>

export class 接口逻辑测试 {
  public constructor(
    private 前置过程: () => Promise<void>,
    private 后置过程: () => Promise<void>,
  ) {}

  public async 运行(): Promise<void> {
    await this.前置过程()
    await this.后置过程()
  }
}
