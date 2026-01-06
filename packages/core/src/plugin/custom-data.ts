import type { z } from 'zod'
import { 插件 } from '../interface/interface-plugin'

/**
 * 该插件允许使用者给定任意的数据, 该数据将作为该插件的返回值, 最终传入到接口逻辑中
 */
export class 自定义数据插件<Data extends z.AnyZodObject> extends 插件<Data> {
  public constructor(t: Data, data: z.infer<Data>) {
    super(t, async (_res, _req, 附加参数) => {
      let log = 附加参数.log.extend(自定义数据插件.name)
      await log.debug('自定义数据插件运行, 结果: %o', data)
      return data
    })
  }
}
