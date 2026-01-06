import { 接口测试 } from '@lsby/net-core'
import assert from 'assert'
import { POST请求用例 } from '../../tools/request'
import 接口 from './index'

export default new 接口测试(
  接口,
  '成功',
  async (): Promise<void> => {
    // 调用接口前的操作, 通常可以做对测试库的初始化等操作
  },
  async (): Promise<object> => {
    return POST请求用例(接口, { a: 1, b: 2 })
  },
  async (解析结果): Promise<void> => {
    assert.equal(解析结果.data.result, 3)
  },
)
