import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { Readable } from 'node:stream'
import { z } from 'zod'
import { 递归截断字符串 } from '../help/interior'
import { 接口返回器 } from '../interface/interface-returner'
import { 请求附加参数类型 } from '../server/server'

export class 文件下载返回器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodObject<{
    data: z.ZodType<Readable>
    filename: z.ZodOptional<z.ZodString>
    mimeType: z.ZodOptional<z.ZodString>
  }>,
> extends 接口返回器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 实现错误类型Zod }>,
  z.ZodAny
> {
  public constructor(private 实现错误类型Zod: 实现错误类型Zod) {
    super()
  }

  public override 获得接口错误形式Zod(): z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 实现错误类型Zod }> {
    return z.object({ status: z.literal('fail'), data: this.实现错误类型Zod })
  }
  public override 获得接口正确形式Zod(): z.ZodAny {
    return z.any()
  }

  public override 实现(
    req: Request,
    res: Response,
    数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
    请求附加参数: 请求附加参数类型,
  ): void {
    let log = 请求附加参数.log
    switch (数据.getTag()) {
      case 'Left': {
        let 实际数据 = 数据.assertLeft().getLeft()

        let 校验结果 = this.实现错误类型Zod.safeParse(实际数据)
        if (校验结果.success === false) {
          let 结果字符串 = JSON.stringify(递归截断字符串(实际数据))
          void log.error(`结果无法通过校验: ${结果字符串}`)
          void log.error('错误: %o', JSON.stringify(校验结果.error))
          throw new Error(`结果无法通过校验`)
        }

        let 返回数据 = { status: 'fail' as const, data: 实际数据 }
        void log.debug('最终结果: %o', JSON.stringify(递归截断字符串(返回数据)))
        res.send(返回数据)

        break
      }
      case 'Right': {
        let 实际数据 = 数据.assertRight().getRight()

        let 实现正确类型Zod = z.object({
          data: z.instanceof(Readable),
          filename: z.string().optional(),
          mimeType: z.string().optional(),
        })
        let 校验结果 = 实现正确类型Zod.safeParse(实际数据)
        if (校验结果.success === false) {
          let 结果字符串 = JSON.stringify(递归截断字符串(实际数据))
          void log.error(`结果无法通过校验: ${结果字符串}`)
          void log.error('错误: %o', JSON.stringify(校验结果.error))
          throw new Error(`结果无法通过校验`)
        }

        // 设置响应头
        if (实际数据.mimeType !== void 0) {
          res.setHeader('Content-Type', 实际数据.mimeType)
        }

        if (实际数据.filename !== void 0) {
          // 对文件名进行 URL 编码，以支持中文等特殊字符
          let encodedFilename = encodeURIComponent(实际数据.filename)
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
        }

        // 返回文件流
        实际数据.data.pipe(res)

        break
      }
    }
  }
}
