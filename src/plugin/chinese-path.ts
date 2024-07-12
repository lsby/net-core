import { URL } from 'node:url'
import type { Request } from 'express'
import { z } from 'zod'
import { 插件 } from '../interface/plug'

const zod类型表示 = z.object({})

export class 中文路径支持插件 extends 插件<typeof zod类型表示> {
  constructor() {
    super(zod类型表示, async (request: Request) => {
      const url = new URL(request.url)
      const pathname = url.pathname
      request.url = request.originalUrl = pathname.replace(pathname, decodeURIComponent(pathname))
      return {}
    })
  }
}
