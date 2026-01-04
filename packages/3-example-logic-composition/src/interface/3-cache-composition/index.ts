import {
  JSON参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { 缓存逻辑 } from '../../interface-logic/cache-logic'

// =======================
// 通用缓存逻辑示例
// =======================
// 这个示例展示了:
// - 业务无关 的 通用接口逻辑(缓存) 的用法
// - 如何将 通用逻辑 与 业务逻辑 组合
// - 完全类型安全的缓存系统
//
// 只需要在执行链上绑定一个新的 接口逻辑, 就可以获得这个 接口逻辑 提供的数据
// 可以通过 参数 将 接口逻辑 和 实际业务 完全解耦, 这种 接口逻辑 称为 通用接口逻辑
// 这种 通用接口逻辑 甚至可以被发成 npm 包, 因为它和实际业务完全无关, 可以实现跨项目复用
// 可以想象, 当 通用接口逻辑 足够多时, 开发接口就变成组合这些 通用接口逻辑 的拼乐高游戏
// 并且它们的组合是类型安全的, 类型系统会检查连接处的类型是否匹配

let 接口路径 = '/api/composition/user-with-cache' as const
let 接口方法 = 'post' as const

let 查询参数类型描述 = z.object({ userId: z.string() })
let 预期返回类型描述 = z.object({ 用户id: z.string(), 姓名: z.string(), 邮箱: z.string(), 创建时间: z.string() })
type 用户信息类型 = z.infer<typeof 预期返回类型描述>

let 接口逻辑实现 = 接口逻辑
  .空逻辑()
  // 这里绑定了一个 缓存逻辑, 这是一个 通用接口逻辑
  // 它会提供两个值:
  // - 缓存数据: 如果命中缓存, 会得到缓存数据, 否则会得到null
  // - 设置缓存: 用来设置缓存
  .绑定(new 缓存逻辑(查询参数类型描述, 预期返回类型描述, 10 * 1000))
  .绑定(
    接口逻辑.构造([new JSON参数解析插件(查询参数类型描述, {})], async (参数, 逻辑附加参数, 请求附加参数) => {
      let log = 请求附加参数.log

      // 如果缓存命中, 可以在这里直接用缓存数据返回
      if (逻辑附加参数.缓存数据 !== null) return new Right({ 用户数据: 逻辑附加参数.缓存数据 })

      // 否则, 读取数据
      let { userId } = 参数.body

      // 模拟用户数据库
      let 用户库: Record<string, 用户信息类型> = {
        'user-001': { 用户id: 'user-001', 姓名: '张三', 邮箱: 'zhangsan@example.com', 创建时间: '2024-01-01' },
        'user-002': { 用户id: 'user-002', 姓名: '李四', 邮箱: 'lisi@example.com', 创建时间: '2024-01-02' },
        'user-003': { 用户id: 'user-003', 姓名: '王五', 邮箱: 'wangwu@example.com', 创建时间: '2024-01-03' },
      }

      let 用户数据 = 用户库[userId]
      if (用户数据 === void 0) {
        await log.warn('用户不存在: %s', userId)
        // 因为 ts 无法将 null 推断为 X | null, 所以需要手动标注
        return new Right({ 用户数据: null as 用户信息类型 | null })
      }

      // 正确取到数据, 设置缓存
      逻辑附加参数.设置缓存(用户数据)
      await log.info('查询用户成功: %s', userId)

      return new Right({ 用户数据: 用户数据 })
    }),
  )

type _接口逻辑JSON参数 = 计算接口逻辑JSON参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

let 接口返回器 = new 常用接口返回器(z.never(), z.object({ 用户数据: 预期返回类型描述.or(z.null()) }))

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
