import express from 'express'
import { format } from 'node:util'
import { z } from 'zod'
import { 插件 } from '../plug'

export class 表单参数解析插件<Result extends z.AnyZodObject> extends 插件<z.ZodObject<{ form: Result }>> {
  public constructor(t: Result, opt: Parameters<typeof express.urlencoded>[0]) {
    super(z.object({ form: t }), async (req, res, 附加参数) => {
      let log = 附加参数.log.extend('表单参数解析插件')

      await new Promise((pRes, _rej) =>
        express.urlencoded({ extended: true, ...opt })(req, res, () => {
          pRes(null)
        }),
      )

      let parseResult = t.safeParse(req.body)
      if (parseResult.success === false) {
        await log.error('解析url编码正文失败: %o', JSON.stringify(parseResult.error))
        throw new Error(format('解析url编码正文失败: %o', JSON.stringify(parseResult.error)))
      }

      return { form: parseResult.data }
    })
  }
}
