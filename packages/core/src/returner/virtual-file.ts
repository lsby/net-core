import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 接口返回器 } from '../interface/interface-returner'
import { 请求附加参数类型 } from '../server/server'

/**
 * ### 虚拟文件返回器
 *
 * 用于返回虚拟文件（内存中生成的文件）
 * 接口逻辑直接提供文件内容和MIME类型
 * 支持自定义:
 * - 缓存配置
 * - 错误处理
 */
export class 虚拟文件返回器 extends 接口返回器<
  string,
  { fileContent: string | Buffer; MIMEType: string },
  z.ZodAny,
  z.ZodAny
> {
  private 缓存控制: string | undefined

  public constructor(options: { 缓存控制?: string }) {
    super()
    this.缓存控制 = options.缓存控制
  }

  public override 获得接口错误形式Zod(): z.ZodAny {
    return z.any()
  }
  public override 获得接口正确形式Zod(): z.ZodAny {
    return z.any()
  }

  public override 实现(
    req: Request,
    res: Response,
    数据: Either<string, { fileContent: string | Buffer; MIMEType: string }>,
    请求附加参数: 请求附加参数类型,
  ): void {
    let log = 请求附加参数.log

    if (数据.getTag() === 'Left') {
      // 处理错误情况
      let 错误消息 = 数据.assertLeft().getLeft()
      void log.error('文件生成失败: %s', 错误消息)
      res.status(404).send({ error: 错误消息 })
      return
    }

    // 处理成功情况
    let { fileContent, MIMEType } = 数据.assertRight().getRight()

    // 设置响应头
    res.setHeader('Content-Type', MIMEType)

    let 缓存控制 = this.缓存控制
    if (缓存控制 !== void 0) {
      res.setHeader('Cache-Control', 缓存控制)
    }

    void log.debug('返回虚拟文件, MIME类型: %s', MIMEType)
    res.send(fileContent)
  }
}
