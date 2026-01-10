import { Right } from '@lsby/ts-fp-data'
import { z } from 'zod'
import { 插件 } from '../interface/interface-plugin'

let 错误类型描述 = z.never()

export class 自定义数据插件<Data extends z.AnyZodObject> extends 插件<typeof 错误类型描述, Data> {
  public constructor(t: Data, data: z.infer<Data>) {
    super(错误类型描述, t, async (_res, _req, 附加参数) => {
      let log = 附加参数.log.extend(自定义数据插件.name)
      await log.debug('自定义数据插件运行, 结果: %o', data)
      return new Right(data)
    })
  }
}
