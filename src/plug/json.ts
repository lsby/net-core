import { format } from 'node:util'
import express from 'express'
import type { z } from 'zod'
import { Task } from '@lsby/ts-fp-data'
import { GlobalLog } from '../global/global'
import { 插件 } from '../interface/plug'

export class JSON解析插件<Result extends z.ZodObject<{ body: z.AnyZodObject }>> extends 插件<Result> {
  private log = GlobalLog.getInstance()

  constructor(t: Result, opt: Parameters<typeof express.json>[0]) {
    super(
      t,
      (req, res) =>
        new Task(async () => {
          var log = (await this.log.run()).extend('JSON解析插件')

          await new Promise((pRes, _rej) =>
            express.json(opt)(req, res, () => {
              pRes(null)
            }),
          )

          await log.debug('准备解析 Json：%o', req.body).run()
          const parseResult = t.safeParse({ body: req.body })

          if (!parseResult.success) {
            await log.err('解析 Json 失败：%o', parseResult.error).run()
            throw new Error(format('Parse JSON body failed: %O', parseResult.error))
          }

          await log.debug('成功解析 Json：%o', parseResult.data.body).run()
          return { body: parseResult.data.body }
        }),
    )
  }
}
