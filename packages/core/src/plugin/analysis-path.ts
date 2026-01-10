import { Right } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import path from 'node:path'
import { z } from 'zod'
import { 递归截断字符串 } from '../help/interior'
import { 插件 } from '../interface/interface-plugin'
import { 请求附加参数类型 } from '../types/types'

let 错误类型描述 = z.never()
let 正确类型描述 = z.object({
  path: z.object({ rawPath: z.string(), dir: z.string(), file: z.string(), ext: z.string() }),
})

export class 路径解析插件 extends 插件<typeof 错误类型描述, typeof 正确类型描述> {
  public constructor() {
    super(错误类型描述, 正确类型描述, async (req: Request, res: Response, 附加参数: 请求附加参数类型) => {
      let log = 附加参数.log.extend(路径解析插件.name)

      let rawPath = decodeURIComponent(req.path)
      await log.debug('原始路径: %s', rawPath)

      let dir = path.dirname(rawPath)
      let file = path.basename(rawPath)
      let ext = path.extname(rawPath)

      let parsedPath = { rawPath, dir, file, ext }

      await log.debug('解析后的路径: %o', JSON.stringify(递归截断字符串(parsedPath)))

      return new Right({ path: parsedPath })
    })
  }
}
