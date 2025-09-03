import type { Request } from 'express'
import { URL } from 'node:url'
import { z } from 'zod'
import { 插件 } from '../plug'

let zod类型表示 = z.object({})

export class 中文路径支持插件 extends 插件<typeof zod类型表示> {
  public constructor() {
    super(zod类型表示, async (request: Request) => {
      let url = new URL(request.url)
      let pathname = url.pathname
      request.url = request.originalUrl = pathname.replace(pathname, decodeURIComponent(pathname))
      return {}
    })
  }
}
