import { Query参数解析插件, 接口, 接口逻辑, 文件下载返回器 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { Readable } from 'stream'
import { z } from 'zod'

// =======================
// 文件下载接口
// =======================
// 这个示例演示了:
// - 如何编写文件下载接口

let 接口路径 = '/api/download-file' as const
let 接口方法 = 'get' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [new Query参数解析插件(z.object({ filename: z.string() }))],
  async (参数, _逻辑附加参数, _请求附加参数) => {
    let { filename } = 参数.query

    // 创建虚拟文件流
    let fileStream = Readable.from(`这是虚拟文件 "${filename}" 的内容。\n时间戳: ${new Date().toISOString()}\n`)

    return new Right({ data: fileStream, filename: filename, mimeType: 'application/octet-stream' })
  },
)

// 本例中, 使用内置的"文件下载返回器"来返回数据
// 它要求"接口逻辑"正确情况下必须返回 { data: Readable, filename: string, mimeType: string }
// 所以, 只需要传入"接口逻辑"的"错误类型描述"即可, 本例中, "接口逻辑"不会产生错误, 所以使用 z.never()
let 接口返回器 = new 文件下载返回器(z.never())

export default new 接口(接口路径, 接口方法, 接口逻辑实现, 接口返回器)
