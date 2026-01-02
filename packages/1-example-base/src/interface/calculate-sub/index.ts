import {
  JSON参数解析插件,
  常用结果转换器,
  常用结果返回器,
  接口,
  接口逻辑,
  计算接口逻辑JSON参数,
  计算接口逻辑正确结果,
  计算接口逻辑错误结果,
} from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { 加法接口 } from '../calculate-add'

// 这个示例相比add进行了大幅简化, 展示了实际写接口的样子

// 接口路径和方法定义
let 接口路径 = '/api/calculate-sub' as const
let 接口方法 = 'post' as const

// 接口逻辑实现
let 接口逻辑实现 = 接口逻辑.构造(
  [new JSON参数解析插件(z.object({ a: z.number(), b: z.number() }), {})],
  async (参数, 逻辑附加参数, 请求附加参数) => {
    let { a, b } = 参数.body

    // 可以复用其他接口逻辑
    // 内部调用时, 需要传入原来由请求方传入的参数, 参数类型也是类型安全的
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

// 接口错误值, 正确值定义
let 接口错误类型描述 = z.enum(['调用接口失败']) // 如果接口可能返回错误, 需要写出来
let 接口正确类型描述 = z.object({ result: z.number() })

// 接口返回值, 返回方式定义
let 结果转换器 = new 常用结果转换器(接口错误类型描述, 接口正确类型描述)
let 结果返回器 = new 常用结果返回器()

// 导出接口
export default new 接口(接口路径, 接口方法, 接口逻辑实现, 结果转换器, 结果返回器)
