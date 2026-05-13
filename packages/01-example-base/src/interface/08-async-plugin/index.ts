import {
  JSON参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  自定义插件,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Right, Task } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 异步插件示例
// =======================
// 这个示例展示了:
// - 如何使用 Task 包裹异步初始化的插件
// - 如何在插件数组中混合使用同步插件和 Task 包裹的插件
// - Task 包裹的插件同样参与类型推导, 业务逻辑的参数类型是正确的

// 接口路径和方法定义
let 接口路径 = '/api/async-plugin-demo' as const
let 接口方法 = 'post' as const

// --------------------
// 模拟异步操作
// --------------------
// 在实际使用中, 这可能是从数据库读取配置、获取密钥等需要异步操作才能完成的事情
// 例如: 从数据库读取JWT密钥, 然后构造JWT鉴权插件
// 使用 Task 包裹可以避免顶层 await 的兼容性问题
let 异步初始化的插件 = new Task(async () => {
  // 模拟异步操作, 比如从数据库获取配置
  let 配置 = await Promise.resolve({ 版本: '1.0.0', 模式: 'demo' })

  // 用获取到的配置构造插件
  return new 自定义插件(
    z.never(),
    z.object({ 系统信息: z.object({ 版本: z.string(), 模式: z.string() }) }),
    async (_req, _res, _请求附加参数) => {
      return new Right({ 系统信息: 配置 })
    },
  )
})

// 接口逻辑实现
// 注意: 插件数组中混合了直接的插件实例和 Task 包裹的插件
// 两者的返回值都会被正确合并到 参数 中, 类型推导完全正确
let 接口逻辑实现 = 接口逻辑.构造(
  [new JSON参数解析插件(z.object({ 名称: z.string() }), {}), 异步初始化的插件],
  async (参数, _逻辑附加参数, 请求附加参数) => {
    let log = 请求附加参数.log

    // 参数.json 来自 JSON参数解析插件 (同步插件)
    let { 名称 } = 参数.json

    // 参数.系统信息 来自 Task 包裹的异步插件, 类型推导完全正确
    let { 版本, 模式 } = 参数.系统信息

    await log.info('收到请求, 名称: %s, 系统版本: %s, 模式: %s', 名称, 版本, 模式)

    return new Right({ 消息: `你好 ${名称}! 当前系统版本: ${版本}, 模式: ${模式}` })
  },
)

// 接口逻辑信息预览 - 类型正确包含两个插件的合并结果
type _接口逻辑JSON参数 = 计算接口逻辑JSON参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

// 接口返回器定义
let 接口返回器 = new 常用接口返回器(z.never(), z.object({ 消息: z.string() }))

// 导出接口
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
