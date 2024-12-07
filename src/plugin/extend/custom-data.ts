import type { z } from 'zod'
import { Global } from '../../global/global'
import { 插件 } from '../plug'

export class 自定义数据插件<Data extends z.AnyZodObject> extends 插件<Data> {
  private log = Global.getItem('log')

  constructor(t: Data, data: z.infer<Data>) {
    super(t, async (_res, _req, 附加参数) => {
      let log = (await this.log).extend(附加参数.请求id).extend('自定义数据插件')
      await log.debug('自定义数据插件运行, 结果: %o', data)
      return data
    })
  }
}
