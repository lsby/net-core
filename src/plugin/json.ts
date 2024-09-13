import { format } from 'node:util'
import express from 'express'
import { AnyZodObject, z } from 'zod'
import { Global } from '../global/global'
import { 包装插件项, 取Task插件内部类型, 合并插件结果, 插件, 插件项类型 } from '../interface/plug'
import { 获得接口插件们 } from '../interface/type/interface-type-abstract'

export class JSON解析插件<Result extends AnyZodObject> extends 插件<z.ZodObject<{ body: Result }>> {
  private log = Global.getItem('log')

  constructor(t: Result, opt: Parameters<typeof express.json>[0]) {
    super(z.object({ body: t }), async (req, res) => {
      var log = (await this.log).extend('JSON解析插件')

      await new Promise((pRes, _rej) =>
        express.json(opt)(req, res, () => {
          pRes(null)
        }),
      )

      await log.debug('准备解析 JSON：%o', req.body)
      const parseResult = z.object({ body: t }).safeParse({ body: req.body as unknown })

      if (!parseResult.success) {
        await log.err('解析 JSON 失败：%o', parseResult.error)
        throw new Error(format('Parse JSON body failed: %O', parseResult.error))
      }

      await log.debug('成功解析 JSON：%o', parseResult.data.body)
      return parseResult.data
    })
  }
}

export type 任意JSON解析插件 = JSON解析插件<any>
export type 任意JSON解析插件项 = 包装插件项<任意JSON解析插件>
export type 合并JSON插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? 插件项 extends 任意JSON解析插件项
          ? z.infer<取Task插件内部类型<插件项>>['body'] & 合并插件结果<xs>
          : 合并JSON插件结果<xs>
        : {}
      : {}
    : {}
export type 从接口类型获得JSON参数<接口类型描述> = 合并JSON插件结果<获得接口插件们<接口类型描述>>
