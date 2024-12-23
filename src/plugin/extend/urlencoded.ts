import { format } from 'node:util'
import express from 'express'
import type { z } from 'zod'
import { Global } from '../../global/global'
import { 插件 } from '../plug'

export class 表单解析插件<Result extends z.AnyZodObject> extends 插件<Result> {
  private log = Global.getItem('log')

  constructor(t: Result, opt: Parameters<typeof express.urlencoded>[0]) {
    super(t, async (req, res, 附加参数) => {
      let log = (await this.log).extend(附加参数.请求id).extend('JSON解析插件')

      await new Promise((pRes, _rej) =>
        express.urlencoded({ extended: true, ...opt })(req, res, () => {
          pRes(null)
        }),
      )

      let parseResult = t.safeParse(req.body)
      if (parseResult.success === false) {
        await log.err('解析url编码正文失败: %O', parseResult.error)
        throw new Error(format('解析url编码正文失败: %O', parseResult.error))
      }

      return parseResult.data
    })
  }
}
