import { z } from 'zod'
import { Global } from '../../global/global'
import { 插件 } from '../plug'

let zod类型表示 = z.object({})

export class 调试请求头插件 extends 插件<typeof zod类型表示> {
  constructor() {
    super(zod类型表示, async (req) => {
      let log = (await Global.getItem('log')).extend('调试请求头插件')

      await log.debug(req.headers)

      return {}
    })
  }
}
