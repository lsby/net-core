import { 接口测试 } from '@lsby/net-core'
import assert from 'assert'
import { POST请求用例 } from '../../tools/request'
import 接口 from './index'

export default new 接口测试(
  接口,
  '失败',
  async (): Promise<void> => {},
  async (): Promise<object> => {
    return POST请求用例(接口, { a: 10, b: 0 })
  },
  async (解析结果): Promise<void> => {
    assert.equal(解析结果.data, '除数不能为0')
  },
)
