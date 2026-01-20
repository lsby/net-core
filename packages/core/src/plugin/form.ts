import { Left, Right } from '@lsby/ts-fp-data'
import multer from 'multer'
import { format } from 'node:util'
import { z } from 'zod'
import { 严格递归合并对象 } from '../help/help'
import { 递归截断字符串 } from '../help/interior'
import { 获得接口逻辑插件类型 } from '../interface/interface-logic'
import { 任意插件, 取插件正确ts类型, 插件 } from '../interface/interface-plugin'

let 错误类型描述 = z.object({ code: z.literal(400), data: z.string() })

let 文件Schema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  buffer: z.instanceof(Buffer),
})

export class Form参数解析插件<Result extends z.AnyZodObject> extends 插件<
  typeof 错误类型描述,
  z.ZodObject<{ form: z.ZodObject<{ data: Result; files: z.ZodArray<typeof 文件Schema> }> }>
> {
  public constructor(t: Result, opt: multer.Options) {
    super(
      错误类型描述,
      z.object({ form: z.object({ data: t, files: z.array(文件Schema) }) }),
      async (req, res, 附加参数) => {
        let log = 附加参数.log.extend(Form参数解析插件.name)

        let upload = multer(opt)
        let multerMiddleware = upload.any()

        await new Promise((pRes, rej) =>
          multerMiddleware(req, res, (err) => {
            if (err === null || typeof err === 'undefined') {
              pRes(null)
            } else {
              rej(err)
            }
          }),
        )

        await log.debug('准备解析 Form 参数：%o', JSON.stringify(递归截断字符串(req.body)))
        let parseResult = t.safeParse(req.body)

        if (parseResult.success === false) {
          await log.error('解析 Form 参数失败：%o', JSON.stringify(parseResult.error))
          return new Left({ code: 400, data: format('解析 Form 参数失败: %o', JSON.stringify(parseResult.error)) })
        }

        let files = (req.files as Express.Multer.File[] | undefined) ?? []

        await log.debug('成功解析 Form 参数和文件')
        return new Right({ form: { data: parseResult.data, files } })
      },
    )
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
          ? 严格递归合并对象<
              {
                form: {
                  data: 取插件正确ts类型<插件项>['form']['data']
                  files: 取插件正确ts类型<插件项>['form']['files']
                }
              },
              合并Form插件结果<xs>
            >
          : 合并Form插件结果<xs>
        : {}
      : {}
    : {}

export type 计算接口逻辑Form参数<接口逻辑> = 合并Form插件结果<获得接口逻辑插件类型<接口逻辑>>
