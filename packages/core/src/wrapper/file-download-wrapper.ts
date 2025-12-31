import type { Request, Response } from 'express'
import type { ReadStream } from 'node:fs'
import { createReadStream } from 'node:fs'
import { z } from 'zod'
import { 接口, 接口方法类型, 接口路径类型 } from '../interface/interface-base'
import { 接口逻辑Base, 空对象, 获得接口逻辑正确类型, 获得接口逻辑错误类型 } from '../interface/interface-logic'
import { 直接形式转换器 } from '../interface/interface-result'
import { 接口结果返回器 } from '../interface/interface-retuen'

export type 文件数据类型 = {
  data: Buffer | ReadStream | string // Buffer | 文件流 | 文件路径
  filename?: string // 可选的文件名用于下载
  mimeType?: string // 可选的 MIME 类型
}

/**
 * 文件下载接口封装
 *
 * 用于提供文件下载能力，支持:
 * - Buffer 直接发送
 * - 文件路径（自动创建流）
 * - 流对象直接传送
 *
 * 使用方式:
 * - 接口逻辑返回 Either<错误, { data: 文件数据 }>
 * - 文件数据可以是 Buffer、文件路径字符串、或 ReadStream
 * - 错误返回标准错误格式
 *
 * 示例:
 * ```ts
 * const 逻辑 = 接口逻辑Base.构造(
 *   [GET参数解析插件],
 *   async ({ query }) => {
 *     const buffer = await fs.readFile(query.filepath)
 *     return new Right({
 *       data: buffer,
 *       filename: 'export.xlsx',
 *       mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 *     })
 *   }
 * )
 *
 * const api = new 文件下载接口封装(
 *   '/api/download',
 *   'get',
 *   逻辑,
 *   z.object({ filepath: z.string() }), // 错误类型
 *   z.object({ data: z.any() })  // 正确类型必须包含 data 字段
 * )
 * ```
 */
export class 文件下载接口封装<
  路径类型 extends 接口路径类型,
  方法类型 extends 接口方法类型,
  逻辑类型 extends 接口逻辑Base<any, 空对象, z.infer<接口错误形式Zod>, { data: 任意文件数据 }, any, any>,
  接口错误形式Zod extends z.ZodTypeAny,
  任意文件数据 = Buffer | ReadStream | string,
> extends 接口<
  路径类型,
  方法类型,
  逻辑类型,
  z.ZodObject<{ status: z.ZodLiteral<'fail'>; data: 接口错误形式Zod }>,
  z.ZodType<any>,
  直接形式转换器<任意文件数据, 获得接口逻辑错误类型<逻辑类型>, 获得接口逻辑正确类型<逻辑类型>>,
  文件下载返回器
> {
  public constructor(
    请求路径: 路径类型,
    请求方法: 方法类型,
    接口逻辑: 逻辑类型,
    逻辑错误类型Zod: 接口错误形式Zod,
    文件名?: string,
    MIME类型?: string,
  ) {
    let 接口错误输出形式 = z.object({ status: z.literal('fail'), data: 逻辑错误类型Zod })
    let 接口转换器 = new 直接形式转换器<任意文件数据, 获得接口逻辑错误类型<逻辑类型>, 获得接口逻辑正确类型<逻辑类型>>()
    let 返回器 = new 文件下载返回器(文件名, MIME类型)

    super(
      请求路径,
      请求方法,
      接口逻辑,
      接口错误输出形式,
      z.any(), // 正确形式任意
      接口转换器,
      返回器,
    )
  }
}

/**
 * 文件下载返回器
 *
 * 处理文件的发送，支持:
 * 1. Buffer - 直接设置 Content-Length 后发送
 * 2. ReadStream - 自动 pipe 到响应
 * 3. 文件路径字符串 - 创建读流后发送
 *
 * 自动设置的响应头:
 * - Content-Disposition: 用于设置下载文件名
 * - Content-Type: 根据 MIME 类型设置
 * - Content-Length: 对于 Buffer 自动计算
 */
class 文件下载返回器 extends 接口结果返回器<Buffer | ReadStream | string> {
  public constructor(
    private 文件名?: string,
    private MIME类型?: string,
  ) {
    super()
  }

  public override async 返回(req: Request, res: Response, 结果: Buffer | ReadStream | string): Promise<void> {
    // 设置响应头
    if (this.MIME类型 !== void 0) {
      res.setHeader('Content-Type', this.MIME类型)
    }

    if (this.文件名 !== void 0) {
      // 对文件名进行 URL 编码，以支持中文等特殊字符
      let encodedFilename = encodeURIComponent(this.文件名)
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
    }

    // 根据数据类型处理
    if (Buffer.isBuffer(结果)) {
      res.setHeader('Content-Length', 结果.length)
      res.send(结果)
    } else if (typeof 结果 === 'string') {
      // 认为是文件路径
      let 流 = createReadStream(结果)
      流.pipe(res)
    } else if (typeof 结果.pipe === 'function') {
      // 认为是 ReadStream 或类似对象
      结果.pipe(res)
    } else {
      res.status(400).send('Invalid file data')
    }
  }
}
