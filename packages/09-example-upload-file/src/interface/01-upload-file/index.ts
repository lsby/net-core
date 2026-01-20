import { Form参数解析插件, 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { Left, Right } from '@lsby/ts-fp-data'
import { z } from 'zod'

let 接口路径 = '/api/upload-file' as const
let 接口方法 = 'post' as const

let 接口逻辑实现 = 接口逻辑.构造(
  [
    new Form参数解析插件(z.object({ description: z.string().optional() }), {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  ],

  async (参数, 逻辑附加参数, 请求附加参数) => {
    let _log = 请求附加参数.log

    await _log.info('收到上传请求参数:', 参数)

    let { data, files } = 参数.form

    await _log.info('解析后:', {
      description: data.description,
      fileCount: Array.isArray(files) ? files.length : 'not array',
    })

    try {
      for (let file of files) {
        await _log.info('处理文件:', file.originalname, '大小:', file.size)
        // 如果需要保存文件, 可以写 file.buffer 到文件
      }

      let 返回数据 = {
        message: `成功上传 ${files.length} 个文件`,
        files: files.map((f) => ({ name: f.originalname, size: f.size })),
      }

      return new Right(返回数据)
    } catch (error) {
      await _log.error('文件处理失败:', error)
      return new Left({ code: 400, data: `文件处理失败: ${String(error)}` })
    }
  },
)

export default new 接口(
  接口路径,
  接口方法,
  接口逻辑实现,
  new 常用接口返回器(
    z.object({ code: z.number(), data: z.string() }),
    z.object({ message: z.string(), files: z.array(z.object({ name: z.string(), size: z.number() })) }),
  ),
)
