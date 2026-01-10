import { Left, Right } from '@lsby/ts-fp-data'
import express from 'express'
import { format } from 'node:util'
import { z } from 'zod'
import { 严格递归合并对象 } from '../help/help'
import { 递归截断字符串 } from '../help/interior'
import { 获得接口逻辑插件类型 } from '../interface/interface-logic'
import { 任意插件, 取插件正确ts类型, 插件 } from '../interface/interface-plugin'

let 错误类型描述 = z.object({ code: z.literal(400), data: z.string() })

export class 表单参数解析插件<Result extends z.AnyZodObject> extends 插件<
  typeof 错误类型描述,
  z.ZodObject<{ form: Result }>
> {
  public constructor(t: Result, opt: Parameters<typeof express.urlencoded>[0]) {
    super(错误类型描述, z.object({ form: t }), async (req, res, 附加参数) => {
      let log = 附加参数.log.extend(表单参数解析插件.name)

      await new Promise((pRes, _rej) =>
        express.urlencoded({ extended: true, ...opt })(req, res, () => {
          pRes(null)
        }),
      )

      await log.debug('准备解析表单数据：%o', JSON.stringify(递归截断字符串(req.body)))
      let parseResult = t.safeParse(req.body)

      if (parseResult.success === false) {
        await log.error('解析表单数据失败：%o', JSON.stringify(parseResult.error))
        return new Left({ code: 400, data: format('解析表单数据失败: %o', JSON.stringify(parseResult.error)) })
      }

      await log.debug('成功解析表单数据')
      return new Right({ form: parseResult.data })
    })
  }
}

export type 任意表单参数解析插件 = 表单参数解析插件<any>
export type 任意表单参数解析插件项 = 任意表单参数解析插件
export type 合并表单插件结果<Arr extends Array<任意插件>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<任意插件>
        ? 插件项 extends 任意表单参数解析插件项
          ? 严格递归合并对象<{ form: 取插件正确ts类型<插件项>['form'] }, 合并表单插件结果<xs>>
          : 合并表单插件结果<xs>
        : {}
      : {}
    : {}

export type 计算接口逻辑表单参数<接口逻辑> = 合并表单插件结果<获得接口逻辑插件类型<接口逻辑>>
