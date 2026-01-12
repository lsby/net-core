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

/**
 * 路径解析插件 - 用于解析和分析 HTTP 请求的路径
 *
 * 功能说明：
 * - 对请求路径进行 URL 解码
 * - 解析路径的各个组成部分：目录、文件名、扩展名
 *
 * 返回数据结构：
 * - rawPath: 解码后的完整路径
 * - dir: 目录部分
 * - file: 文件名（含扩展名）
 * - ext: 文件扩展名（包括点号）
 *
 * 使用示例：
 * 请求 URL: /api/users/profile.json?id=123
 * 返回结果:
 * {
 *   path: {
 *     rawPath: "/api/users/profile.json",
 *     dir: "/api/users",
 *     file: "profile.json",
 *     ext: ".json"
 *   }
 * }
 */
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
