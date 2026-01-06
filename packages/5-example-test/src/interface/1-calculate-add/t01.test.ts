import { 接口测试 } from '@lsby/net-core'
import assert from 'assert'
import { POST请求用例 } from '../../tools/request'
import 接口 from './index'

// 对于接口的单元测试, 使用"接口测试"来测试
// 需要提供:
// - 接口: 接口对象
// - 预期结果: 成功或失败
// - 前置过程: 用于调用接口前的操作, 通常可以做对测试库的初始化等操作
// - 中置过程: 用于实际调用接口, 必须返回调用结果
// - 后置过程: 用于验证结果, 会收到按"预期结果"解析过的, 中置操作的返回结果
export default new 接口测试(
  接口,
  '成功',
  async (): Promise<void> => {},
  async (): Promise<object> => {
    return POST请求用例(接口, { a: 1, b: 2 })
  },
  async (解析结果): Promise<void> => {
    assert.equal(解析结果.data.result, 3)
  },
)
