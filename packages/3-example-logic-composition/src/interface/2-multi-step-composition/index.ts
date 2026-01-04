import { JSON参数解析插件, 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

// =======================
// 接口逻辑组合 - 示例
// =======================
// 这个示例展示了:
// - 简化的接口逻辑组合的写法
// - 逻辑附加参数的深度合并
// - 在相对复杂的场景下, 接口逻辑组合的使用

let 接口路径 = '/api/composition/create-order' as const
let 接口方法 = 'post' as const

let 组合逻辑 = 接口逻辑
  .空逻辑()
  // 第一步：解析订单基本信息
  .绑定(
    接口逻辑.构造(
      [new JSON参数解析插件(z.object({ 商品id: z.string(), 用户id: z.string(), 地区: z.string() }), {})],
      async (参数, _逻辑附加参数, 请求附加参数) => {
        let 日志 = 请求附加参数.log
        let { 商品id, 用户id, 地区 } = 参数.body

        await 日志.info('订单初始化: 用户id=%s, 商品id=%s, 地区=%s', 用户id, 商品id, 地区)

        return new Right({ 用户id, 商品id, 地区, 创建时间: new Date().toISOString() })
      },
    ),
  )
  // 第二步：获取商品价格和库存，合并商品详情
  .绑定(
    接口逻辑.构造([], async (_参数, 逻辑附加参数, _请求附加参数) => {
      // 这里可以获取上游返回的数据
      let { 商品id } = 逻辑附加参数

      // 模拟商品数据库
      let 商品库: Record<string, { 名称: string; 价格: number }> = {
        P001: { 名称: '笔记本', 价格: 4999.99 },
        P002: { 名称: '键盘', 价格: 599.99 },
        P003: { 名称: '鼠标', 价格: 199.99 },
        P004: { 名称: '显示器', 价格: 1299.99 },
      }

      let 目标商品 = 商品库[商品id]
      if (目标商品 === void 0) return new Left('商品不存在' as const)

      return new Right({ 名称: 目标商品.名称, 价格: 目标商品.价格 })
    }),
  )
  // 第三步：生成订单号
  .绑定(
    接口逻辑.构造([], async (_参数, 逻辑附加参数, _请求附加参数) => {
      // 这里可以获取上游返回的数据
      let { 商品id, 价格 } = 逻辑附加参数

      let 日志 = _请求附加参数.log
      let 订单号 = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      await 日志.info('订单已生成: 订单号=%s, 价格=%.2f', 订单号, 商品id, 价格)

      return new Right({ 订单号, 商品id, 价格 })
    }),
  )

let 接口返回器 = new 常用接口返回器(
  z.enum(['商品不存在']),
  z.object({ 订单号: z.string(), 商品id: z.string(), 价格: z.number() }),
)

export default new 接口(接口路径, 接口方法, 组合逻辑, 接口返回器)
