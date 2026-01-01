import { format } from 'node:util'
import { z } from 'zod'
import { 严格递归合并对象 } from '../../help/help'
import { 递归截断字符串 } from '../../help/interior'
import { 获得接口逻辑插件类型 } from '../../interface/interface-logic'
import { 取插件内部类型, 插件, 插件项类型 } from '../plug'

const 烙印: unique symbol = Symbol()

export class GET参数解析插件<Result extends z.AnyZodObject> extends 插件<z.ZodObject<{ query: Result }>> {
  private [烙印] = ['GET参数解析插件']

  public constructor(t: Result) {
    super(z.object({ query: t }), async (req, _res, 附加参数) => {
      let log = 附加参数.log.extend('GET参数解析插件')

      await log.debug('准备解析 GET 参数：%o', JSON.stringify(递归截断字符串(req.query)))
      let parseResult = t.safeParse(req.query)

      if (parseResult.success === false) {
        await log.error('解析 GET 参数失败：%o', JSON.stringify(parseResult.error))
        throw new Error(format('解析 GET 参数失败: %o', JSON.stringify(parseResult.error)))
      }

      await log.debug('成功解析 GET 参数')
      return { query: parseResult.data }
    })
  }
}

export type 任意GET参数解析插件 = GET参数解析插件<any>
export type 任意GET参数解析插件项 = 任意GET参数解析插件
export type 合并GET插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? 插件项 extends 任意GET参数解析插件项
          ? 严格递归合并对象<{ query: z.infer<取插件内部类型<插件项>>['query'] }, 合并GET插件结果<xs>>
          : 合并GET插件结果<xs>
        : {}
      : {}
    : {}

export type 计算接口逻辑GET参数<接口逻辑> = 合并GET插件结果<获得接口逻辑插件类型<接口逻辑>>
