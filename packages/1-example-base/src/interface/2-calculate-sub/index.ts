import {
  JSON参数解析插件,
  常用接口返回器,
  接口,
  接口逻辑,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { 加法接口 } from '../1-calculate-add'

// =======================
// 减法接口
// =======================
// 这个示例展示了:
// - 简化的接口逻辑写法
// - 如何复用其他接口逻辑

// 接口路径和方法定义
let 接口路径 = '/api/calculate-sub' as const
let 接口方法 = 'post' as const

// 接口逻辑实现
let 接口逻辑实现 = 接口逻辑.构造(
  [new JSON参数解析插件(z.object({ a: z.number(), b: z.number() }), {})],
  async (参数, 逻辑附加参数, 请求附加参数) => {
    let { a, b } = 参数.body

    // 复用其他接口逻辑
    // 调用时, 需要传入原来由插件提供的参数, 这是有类型检查的
    // 调用结果是 Either, 需要按左右值讨论
    let 调用结果 = await 加法接口.实现({ body: { a: a, b: b * -1 } }, 逻辑附加参数, 请求附加参数)
    if (调用结果.isLeft()) return new Left('调用接口失败' as const)
    let 调用右值 = 调用结果.assertRight().getRight().result

    return new Right({ result: 调用右值 })
  },
)

// 接口逻辑信息预览
type _接口逻辑JSON参数 = 计算接口逻辑JSON参数<typeof 接口逻辑实现>
type _接口逻辑错误返回 = 计算接口逻辑错误结果<typeof 接口逻辑实现>
type _接口逻辑正确返回 = 计算接口逻辑正确结果<typeof 接口逻辑实现>

// 接口逻辑的错误值, 正确值定义
let 接口错误类型描述 = z.enum(['调用接口失败'])
let 接口正确类型描述 = z.object({ result: z.number() })

// 接口返回器定义
let 接口返回器 = new 常用接口返回器(接口错误类型描述, 接口正确类型描述)

// 导出接口
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
