import { Left, Right } from '@lsby/ts-fp-data'
import express from 'express'
import { format } from 'node:util'
import { z } from 'zod'
import { 严格递归合并对象 } from '../help/help'
import { 递归截断字符串 } from '../help/interior'
import { 获得接口逻辑插件类型 } from '../interface/interface-logic'
import { 取插件内部类型, 插件, 插件项类型 } from '../interface/interface-plugin'

const 烙印: unique symbol = Symbol()

export class JSON参数解析插件<Result extends z.AnyZodObject> extends 插件<
  { status: 'error'; code: 400; message: string },
  z.ZodObject<{ body: Result }>
> {
  private [烙印] = ['JSON参数解析插件']

  public constructor(t: Result, opt: Parameters<typeof express.json>[0]) {
    super(z.object({ body: t }), async (req, res, 附加参数) => {
      let log = 附加参数.log.extend(JSON参数解析插件.name)

      await new Promise((pRes, _rej) =>
        express.json(opt)(req, res, () => {
          pRes(null)
        }),
      )

      await log.debug('准备解析 JSON 参数：%o', JSON.stringify(递归截断字符串(req.body)))
      let parseResult = t.safeParse(req.body)

      if (parseResult.success === false) {
        await log.error('解析 JSON 参数失败：%o', JSON.stringify(parseResult.error))
        return new Left({
          status: 400,
          data: {
            status: 'error',
            code: 400,
            message: format('解析 JSON 失败: %o', JSON.stringify(parseResult.error)),
          },
        })
      }

      await log.debug('成功解析 JSON 参数')
      return new Right({ body: parseResult.data })
    })
  }
}

export type 任意JSON参数解析插件 = JSON参数解析插件<any>
export type 任意JSON参数解析插件项 = 任意JSON参数解析插件
export type 合并JSON插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? 插件项 extends 任意JSON参数解析插件项
          ? 严格递归合并对象<{ body: z.infer<取插件内部类型<插件项>>['body'] }, 合并JSON插件结果<xs>>
          : 合并JSON插件结果<xs>
        : {}
      : {}
    : {}

export type 计算接口逻辑JSON参数<接口逻辑> = 合并JSON插件结果<获得接口逻辑插件类型<接口逻辑>>
