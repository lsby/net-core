import { 默认请求附加参数 } from '@lsby/net-core'
import assert from 'assert'
import { describe, it } from 'vitest'
import { 加法逻辑 } from '../src/interface/1-calculate-add'
import { 除法逻辑 } from '../src/interface/2-calculate-div'

describe('纯逻辑测试', () => {
  it('加法接口逻辑测试', async () => {
    let 调用结果 = await 加法逻辑.实现({ body: { a: 1, b: 2 } }, {}, 默认请求附加参数)
    assert.equal(调用结果.isLeft(), false)
    assert.equal(调用结果.assertRight().getRight().result, 3)
  })
  it('除法接口逻辑测试_正确情况', async () => {
    let 调用结果 = await 除法逻辑.实现({ body: { a: 10, b: 5 } }, {}, 默认请求附加参数)
    assert.equal(调用结果.isLeft(), false)
    assert.equal(调用结果.assertRight().getRight().result, 2)
  })
  it('除法接口逻辑测试_错误情况', async () => {
    let 调用结果 = await 除法逻辑.实现({ body: { a: 10, b: 0 } }, {}, 默认请求附加参数)
    assert.equal(调用结果.isRight(), false)
    assert.equal(调用结果.assertLeft().getLeft(), '除数不能为0')
  })
})
