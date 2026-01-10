import { 常用接口返回器, 接口, 接口逻辑, 自定义数据插件 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 自定义数据插件示例
// =======================
// 该插件允许直接注入任意数据到业务逻辑中
// 这不是从请求中解析数据, 而是人为提供数据
//
// 使用场景：
// - 注入配置信息(如系统版本等常量)
// - 测试和mock(在测试中注入假数据)
// - 常量数据(如系统信息、构建版本等)

let 接口路径 = '/api/plugins/custom-data' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    // 第一个参数是zod类型描述, 第二个参数是实际的数据
    new 自定义数据插件(z.object({ 注入内容: z.object({ 版本: z.string(), 作者: z.string() }) }), {
      注入内容: { 版本: '1.0.0', 作者: 'lsby' },
    }),
  ],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    // 参数.注入内容 是类型安全的
    let { 版本, 作者 } = 参数.注入内容
    return new Right({ 系统版本: 版本, 开发者: 作者 })
  },
)

let 接口返回器 = new 常用接口返回器(z.never(), z.object({ 系统版本: z.string(), 开发者: z.string() }))

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
