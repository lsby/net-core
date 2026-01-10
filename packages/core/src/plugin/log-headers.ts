import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { 插件 } from '../interface/interface-plugin'

let 错误类型描述 = z.never()
let 正确类型描述 = z.object({})

export class 调试请求头插件 extends 插件<typeof 错误类型描述, typeof 正确类型描述> {
  public constructor() {
    super(错误类型描述, 正确类型描述, async (req, res, 附加参数) => {
      let log = 附加参数.log.extend(调试请求头插件.name)

      await log.debug(req.headers)

      return new Right({})
    })
  }
}
