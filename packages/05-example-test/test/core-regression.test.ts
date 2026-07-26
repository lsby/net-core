import {
  JSON参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  服务器,
  自定义接口返回器,
  默认请求附加参数,
} from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import type { Server } from 'node:http'
import { expect, test } from 'vitest'
import { z } from 'zod'

async function 关闭服务器(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === void 0 ? resolve() : reject(error)))
  })
}

test('组合逻辑在失败时携带已完成的上下文并逆序清理', async () => {
  let 清理记录: string[] = []

  let 上游 = 接口逻辑.构造(
    [],
    async () => new Right({ 上游数据: 1 }),
    async (_参数, 逻辑附加参数) => {
      清理记录.push(`上游:${逻辑附加参数['上游数据']}:${String('下游数据' in 逻辑附加参数)}`)
    },
  )
  let 下游 = 接口逻辑.构造<[], { 上游数据: number }, '下游失败', { 下游数据: number }>(
    [],
    async (_参数, 逻辑附加参数) => {
      expect(逻辑附加参数.上游数据).toBe(1)
      return new Left('下游失败' as const)
    },
    async (_参数, 逻辑附加参数) => {
      清理记录.push(`下游:${逻辑附加参数.上游数据}`)
    },
  )

  let 结果 = await 接口逻辑.空逻辑().绑定(上游).绑定(下游).调用({}, {}, 默认请求附加参数)

  expect(结果.isLeft()).toBe(true)
  expect(清理记录).toEqual(['下游:1', '上游:1:false'])
})

test('一个清理函数失败时仍继续执行其余清理函数', async () => {
  let 清理记录: string[] = []
  let 上游 = 接口逻辑.构造(
    [],
    async () => new Right({ a: 1 }),
    async () => {
      清理记录.push('上游')
      throw new Error('上游清理失败')
    },
  )
  let 下游 = 接口逻辑.构造<[], { a: number }, never, { b: number }>(
    [],
    async () => new Right({ b: 2 }),
    async () => {
      清理记录.push('下游')
    },
  )

  await expect(接口逻辑.空逻辑().绑定(上游).绑定(下游).调用({}, {}, 默认请求附加参数)).rejects.toThrow('上游清理失败')
  expect(清理记录).toEqual(['下游', '上游'])
})

test('全局正则路由可被连续匹配', () => {
  let 接口项 = new 接口(/^\/api\/regexp$/g, 'get', 接口逻辑.空逻辑(), new 常用接口返回器(z.never(), z.object({})))
  expect(接口项.匹配路径('/api/regexp')).toBe(true)
  expect(接口项.匹配路径('/api/regexp')).toBe(true)
})

test('重复的静态路由会在启动前被拒绝', () => {
  let 返回器 = new 常用接口返回器(z.never(), z.object({}))
  let 接口一 = new 接口('/api/duplicate', 'get', 接口逻辑.空逻辑(), 返回器)
  let 接口二 = new 接口('/api/duplicate', 'get', 接口逻辑.空逻辑(), 返回器)
  expect(() => new 服务器({ 接口们: [接口一, 接口二], 端口: 0 })).toThrow('发现重复接口')
})

test('畸形 JSON 返回 400，异步返回器异常返回 500', async () => {
  let JSON接口 = new 接口(
    '/api/invalid-json',
    'post',
    接口逻辑.构造([new JSON参数解析插件(z.object({ value: z.number() }), {})], async () => new Right({})),
    new 常用接口返回器(z.never(), z.object({})),
  )
  let 异步异常接口 = new 接口(
    '/api/async-returner-error',
    'get',
    接口逻辑.空逻辑(),
    new 自定义接口返回器(z.never(), z.object({}), z.any(), z.any(), async () => {
      await Promise.resolve()
      throw new Error('异步返回器失败')
    }),
  )
  let 服务信息 = await new 服务器({ 接口们: [JSON接口, 异步异常接口], 端口: 0 }).run()

  try {
    if (!服务信息.server.listening) {
      await new Promise<void>((resolve) => 服务信息.server.once('listening', resolve))
    }
    let 地址 = 服务信息.server.address()
    if (地址 === null || typeof 地址 === 'string') throw new Error('无法获得测试服务器端口')
    let 基础地址 = `http://127.0.0.1:${地址.port}`

    let JSON响应 = await fetch(`${基础地址}/api/invalid-json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    })
    expect(JSON响应.status).toBe(400)
    expect(await JSON响应.text()).toContain('JSON 解析失败')

    let 异步异常响应 = await fetch(`${基础地址}/api/async-returner-error`)
    expect(异步异常响应.status).toBe(500)
    expect(await 异步异常响应.text()).toBe('Internal Server Error')
  } finally {
    await 关闭服务器(服务信息.server)
  }
})
