import type { z } from 'zod'
import { 插件 } from '../interface/plug'

export class 自定义数据插件<Data extends z.AnyZodObject> extends 插件<Data> {
  constructor(t: Data, data: z.infer<Data>) {
    super(t, async () => data)
  }
}
