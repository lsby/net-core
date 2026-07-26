import { JSON参数解析插件, 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 负载 (Payload) 演示接口
// =======================
// 这个示例演示了:
// - 如何为接口附加额外的类型负载信息 (Payload)
//
// 负载信息主要用于元数据的传递,
// 例如可以用来标记接口是否需要鉴权、作者是谁、所属模块等。
// 这些类型信息会在导出 API 类型定义时一同被生成, 使得纯前端或者 API 调用方能够感知这些元数据。

// 1. 定义插件
let JSON参数解析 = new JSON参数解析插件(z.object({ name: z.string() }), {})

// 2. 定义接口逻辑
let 接口逻辑实现 = 接口逻辑.构造([JSON参数解析], async (参数, _逻辑附加参数, _请求附加参数) => {
  let { name } = 参数.json
  return new Right({ message: `你好, ${name}!` })
})

// 3. 定义接口返回器
let 接口返回器 = new 常用接口返回器(z.never(), z.object({ message: z.string() }))

// 4. 定义接口, 并在构造函数第5个参数传入负载相关信息
let 接口路径 = '/api/payload-demo' as const
let 接口方法 = 'post' as const
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器, {
  需要鉴权: false,
  接口功能描述: '这是一个演示 payload 功能的接口' as const,
})
