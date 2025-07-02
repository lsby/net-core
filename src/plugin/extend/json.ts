import express from 'express'
import { format } from 'node:util'
import { AnyZodObject, z } from 'zod'
import { Global } from '../../global/global'
import { 递归截断字符串 } from '../../help/help'
import { 获得接口逻辑插件类型 } from '../../interface/interface-logic'
import { 包装插件项, 取Task插件内部类型, 插件, 插件项类型 } from '../plug'

export class JSON解析插件<Result extends AnyZodObject> extends 插件<Result> {
  private log = Global.getItem('log')

  constructor(t: Result, opt: Parameters<typeof express.json>[0]) {
    super(t, async (req, res, 附加参数) => {
      let log = 附加参数.log.extend('JSON解析插件')

      await new Promise((pRes, _rej) =>
        express.json(opt)(req, res, () => {
          pRes(null)
        }),
      )

      await log.debug('准备解析 JSON：%o', JSON.stringify(递归截断字符串(req.body)))
      let parseResult = t.safeParse(req.body)

      if (parseResult.success === false) {
        await log.error('解析 JSON 失败：%o', parseResult.error)
        throw new Error(format('解析 JSON 失败: %o', parseResult.error))
      }

      await log.debug('成功解析 JSON')
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
          ? z.infer<取Task插件内部类型<插件项>> & 合并JSON插件结果<xs>
          : 合并JSON插件结果<xs>
        : {}
      : {}
    : {}

export type 计算接口逻辑JSON参数<接口逻辑> = 合并JSON插件结果<获得接口逻辑插件类型<接口逻辑>>
