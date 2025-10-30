import { z } from 'zod'
import { 插件 } from '../plug'

let zod类型表示 = z.object({})

export class 调试请求头插件 extends 插件<typeof zod类型表示> {
  public constructor() {
    super(zod类型表示, async (req, res, 附加参数) => {
      let log = 附加参数.log.extend('调试请求头插件')

      await log.debug(req.headers)

      return {}
    })
  }
}
