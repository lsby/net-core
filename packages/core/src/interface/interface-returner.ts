import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { Readable } from 'node:stream'
import { z } from 'zod'
import { 递归截断字符串 } from '../help/interior'
import { 请求附加参数类型 } from '../server/server'
import { 接口逻辑正确类型, 接口逻辑错误类型 } from './interface-logic'

/**
 * 描述接口逻辑返回的数据将如何返回给调用者.
 */
export abstract class 接口返回器<
  实现错误类型 extends 接口逻辑错误类型,
  实现正确类型 extends 接口逻辑正确类型,
  接口错误类型,
  接口正确类型,
> {
  declare protected readonly __类型保持符号?: [实现错误类型, 实现正确类型, 接口错误类型, 接口正确类型]

  public abstract 实现(
    req: Request,
    res: Response,
    数据: Either<实现错误类型, 实现正确类型>,
    请求附加参数: 请求附加参数类型,
  ): void
}

export type 任意接口返回器 = 接口返回器<any, any, any, any>
export type 获得接口返回器实现错误类型<A> = A extends 接口返回器<infer X, any, any, any> ? X : never
export type 获得接口返回器实现正确类型<A> = A extends 接口返回器<any, infer X, any, any> ? X : never
export type 获得接口返回器接口错误类型<A> = A extends 接口返回器<any, any, infer X, any> ? X : never
export type 获得接口返回器接口正确类型<A> = A extends 接口返回器<any, any, any, infer X> ? X : never

/**
 * 自定义接口返回器
 */
export class 自定义接口返回器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodTypeAny,
  接口错误类型Zod extends z.ZodTypeAny,
  接口正确类型Zod extends z.ZodTypeAny,
> extends 接口返回器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  z.infer<接口错误类型Zod>,
  z.infer<接口正确类型Zod>
> {
  public constructor(
    private 实现错误类型Zod: 实现错误类型Zod,
    private 实现正确类型Zod: 实现正确类型Zod,
    private 接口错误类型Zod: 接口错误类型Zod,
    private 接口正确类型Zod: 接口正确类型Zod,
    private 实现函数: (
      req: Request,
      res: Response,
      数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
      请求附加参数: 请求附加参数类型,
    ) => void,
  ) {
    super()
  }

  public override 实现(
    req: Request,
    res: Response,
    数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
    请求附加参数: 请求附加参数类型,
  ): void {
    this.实现函数(req, res, 数据, 请求附加参数)
  }
}

/**
 * 常用接口返回器
 *
 * 将业务逻辑返回的 Either<错误, 成功> 转换为前端友好的统一格式:
 * - 成功时: { status: 'success', data: ... }
 * - 失败时: { status: 'fail', data: ... }
 * 然后使用 res.send 返回
 *
 * 这种格式让前端可以通过 status 字段统一判断请求是否成功
 */
export class 常用接口返回器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodTypeAny,
> extends 接口返回器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  { status: 'fail'; data: z.infer<实现错误类型Zod> },
  { status: 'success'; data: z.infer<实现正确类型Zod> }
> {
  public constructor(
    private 实现错误类型Zod: 实现错误类型Zod,
    private 实现正确类型Zod: 实现正确类型Zod,
  ) {
    super()
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

        let 校验结果 = this.实现正确类型Zod.safeParse(实际数据)
        if (校验结果.success === false) {
          let 结果字符串 = JSON.stringify(递归截断字符串(实际数据))
          void log.error(`结果无法通过校验: ${结果字符串}`)
          void log.error('错误: %o', JSON.stringify(校验结果.error))
          throw new Error(`结果无法通过校验`)
        }

        let 返回数据 = { status: 'success' as const, data: 数据.assertRight().getRight() }
        void log.debug('最终结果: %o', JSON.stringify(递归截断字符串(返回数据)))
        res.send(返回数据)

        break
      }
    }
  }
}

/**
 * 文件下载返回器
 */
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
  { status: 'fail'; data: z.infer<实现错误类型Zod> },
  any
> {
  private 实现正确类型Zod = z.object({
    data: z.instanceof(Readable),
    filename: z.string().optional(),
    mimeType: z.string().optional(),
  })

  public constructor(private 实现错误类型Zod: 实现错误类型Zod) {
    super()
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

        let 校验结果 = this.实现正确类型Zod.safeParse(实际数据)
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
