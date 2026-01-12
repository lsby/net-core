import { Left, Right } from '@lsby/ts-fp-data'
import multer from 'multer'
import { format } from 'node:util'
import { z } from 'zod'
import { 严格递归合并对象 } from '../help/help'
import { 递归截断字符串 } from '../help/interior'
import { 获得接口逻辑插件类型 } from '../interface/interface-logic'
import { 任意插件, 取插件正确ts类型, 插件 } from '../interface/interface-plugin'

let 错误类型描述 = z.object({ code: z.literal(400), data: z.string() })

export class Form参数解析插件<Result extends z.AnyZodObject> extends 插件<
  typeof 错误类型描述,
  z.ZodObject<{ form: Result }>
> {
  public constructor(t: Result, opt: multer.Options) {
    super(错误类型描述, z.object({ form: t }), async (req, res, 附加参数) => {
      let log = 附加参数.log.extend(Form参数解析插件.name)

      let upload = multer(opt)
      let multerMiddleware = upload.any()

      await new Promise((pRes, rej) =>
        multerMiddleware(req, res, (err) => {
          if (err !== null) {
            rej(err)
          } else {
            pRes(null)
          }
        }),
      )

      await log.debug('准备解析 Form 参数：%o', JSON.stringify(递归截断字符串(req.body)))
      let parseResult = t.safeParse(req.body)

      if (parseResult.success === false) {
        await log.error('解析 Form 参数失败：%o', JSON.stringify(parseResult.error))
        return new Left({ code: 400, data: format('解析 Form 参数失败: %o', JSON.stringify(parseResult.error)) })
      }

      await log.debug('成功解析 Form 参数')
      return new Right({ form: parseResult.data })
    })
  }
}

export type 任意Form参数解析插件 = Form参数解析插件<any>
export type 任意Form参数解析插件项 = 任意Form参数解析插件
export type 合并Form插件结果<Arr extends Array<任意插件>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<任意插件>
        ? 插件项 extends 任意Form参数解析插件项
          ? 严格递归合并对象<{ form: 取插件正确ts类型<插件项>['form'] }, 合并Form插件结果<xs>>
          : 合并Form插件结果<xs>
        : {}
      : {}
    : {}

export type 计算接口逻辑Form参数<接口逻辑> = 合并Form插件结果<获得接口逻辑插件类型<接口逻辑>>
