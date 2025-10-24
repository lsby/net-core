import { z } from 'zod'
import { 插件 } from '../plug'

let zod类型表示 = z.object({ sendFile: z.function(z.tuple([z.instanceof(Buffer)]), z.instanceof(Buffer)) })

export class 发送文件插件 extends 插件<typeof zod类型表示> {
  public constructor() {
    super(zod类型表示, async (_req, _res) => {
      return {
        sendFile: (file: Buffer): Buffer => {
          return file
        },
      }
    })
  }
}
