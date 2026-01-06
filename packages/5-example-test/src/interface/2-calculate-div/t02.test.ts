import { 接口测试 } from '@lsby/net-core'
import assert from 'assert'
import { POST请求用例 } from '../../tools/request'
import 接口 from './index'

export default new 接口测试(
  async (): Promise<void> => {},

  async (): Promise<object> => {
    return POST请求用例(接口, { a: 10, b: 0 })
  },

  async (中置结果: object): Promise<void> => {
    console.log('实际结果: %o', 中置结果)

    let 预期: string = '失败'

    let 失败结果校验 = 接口.获得接口返回器().获得接口错误形式Zod().safeParse(中置结果)
    let 正确结果校验 = 接口.获得接口返回器().获得接口正确形式Zod().safeParse(中置结果)

    if (失败结果校验.success === false && 正确结果校验.success === false) {
      throw new Error('没有通过返回值检查')
    }
    if (正确结果校验.success === true) {
      console.log('预期: %o, 实际: %o', 预期, '调用成功')
      if (预期 === '失败') throw new Error('应该调用失败, 实际调用成功')
    }
    if (失败结果校验.success === true) {
      console.log('预期: %o, 实际: %o', 预期, '调用失败')
      if (预期 === '成功') throw new Error('应该调用成功, 实际调用出错')
    }

    assert.equal(失败结果校验.data?.data, '除数不能为0')
  },
)
