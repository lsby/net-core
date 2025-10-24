import type { z } from 'zod'
import { Global } from '../../global/global'
import { 插件 } from '../plug'

export class 自定义数据插件<Data extends z.AnyZodObject> extends 插件<Data> {
  private log = Global.getItem('log')

  public constructor(t: Data, data: z.infer<Data>) {
    super(t, async (_res, _req, 附加参数) => {
      let log = 附加参数.log.extend('自定义数据插件')
      log.debug('自定义数据插件运行, 结果: %o', data)
      return data
    })
  }
}
