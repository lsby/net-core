import { 接口返回器, 请求附加参数类型 } from '@lsby/net-core'
import type { Request, Response } from 'express'
import { z } from 'zod'

/**
 * ### CORS OPTIONS 处理器
 *
 * 这是一个特殊的接口返回器，用于处理 CORS 预检请求
 * 它会返回适当的 Access-Control-* 响应头
 */
export class CORS选项返回器 extends 接口返回器<never, {}, z.ZodNever, z.ZodNever> {
  private allowMethods: string = 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS'
  private allowHeaders: string = 'Content-Type, Authorization'
  private maxAge: string = '86400'

  public constructor(options?: { allowMethods?: string; allowHeaders?: string; maxAge?: string }) {
    super()
    if (options?.allowMethods !== void 0) this.allowMethods = options.allowMethods
    if (options?.allowHeaders !== void 0) this.allowHeaders = options.allowHeaders
    if (options?.maxAge !== void 0) this.maxAge = options.maxAge
  }

  public override 获得接口错误形式Zod(): z.ZodNever {
    return z.never()
  }

  public override 获得接口正确形式Zod(): z.ZodNever {
    return z.never()
  }

  public override 实现(_req: Request, res: Response, _数据: unknown, _请求附加参数: 请求附加参数类型): void {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', this.allowMethods)
    res.setHeader('Access-Control-Allow-Headers', this.allowHeaders)
    res.setHeader('Access-Control-Max-Age', this.maxAge)
    res.status(204).end()
  }
}
