import { format } from 'node:util'
import express from 'express'
import type { z } from 'zod'
import { 插件 } from '../plug'

export class 表单解析插件<Result extends z.AnyZodObject> extends 插件<Result> {
  constructor(t: Result, opt: Parameters<typeof express.urlencoded>[0]) {
    super(t, async (req, res) => {
      await new Promise((pRes, _rej) =>
        express.urlencoded({ extended: true, ...opt })(req, res, () => {
          pRes(null)
        }),
      )

      const parseResult = t.safeParse(req.body)
      if (!parseResult.success) throw new Error(format('解析url编码正文失败: %O', parseResult.error))

      return parseResult.data
    })
  }
}
