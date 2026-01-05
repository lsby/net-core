import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 递归截断字符串 } from '../help/interior'
import { 接口返回器 } from '../interface/interface-returner'
import { 请求附加参数类型 } from '../server/server'

export class 常用接口返回器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodTypeAny,
> extends 接口返回器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  { status: 'fail'; data: z.infer<实现错误类型Zod> },
  { status: 'success'; data: z.infer<实现正确类型Zod> }
> {
  public constructor(
    private 实现错误类型Zod: 实现错误类型Zod,
    private 实现正确类型Zod: 实现正确类型Zod,
  ) {
    super()
  }

  public override 实现(
    req: Request,
    res: Response,
    数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
    请求附加参数: 请求附加参数类型,
  ): void {
    let log = 请求附加参数.log
    switch (数据.getTag()) {
      case 'Left': {
        let 实际数据 = 数据.assertLeft().getLeft()

        let 校验结果 = this.实现错误类型Zod.safeParse(实际数据)
        if (校验结果.success === false) {
          let 结果字符串 = JSON.stringify(递归截断字符串(实际数据))
          void log.error(`结果无法通过校验: ${结果字符串}`)
          void log.error('错误: %o', JSON.stringify(校验结果.error))
          throw new Error(`结果无法通过校验`)
        }

        let 返回数据 = { status: 'fail' as const, data: 实际数据 }
        void log.debug('最终结果: %o', JSON.stringify(递归截断字符串(返回数据)))
        res.send(返回数据)

        break
      }
      case 'Right': {
        let 实际数据 = 数据.assertRight().getRight()

        let 校验结果 = this.实现正确类型Zod.safeParse(实际数据)
        if (校验结果.success === false) {
          let 结果字符串 = JSON.stringify(递归截断字符串(实际数据))
          void log.error(`结果无法通过校验: ${结果字符串}`)
          void log.error('错误: %o', JSON.stringify(校验结果.error))
          throw new Error(`结果无法通过校验`)
        }

        let 返回数据 = { status: 'success' as const, data: 数据.assertRight().getRight() }
        void log.debug('最终结果: %o', JSON.stringify(递归截断字符串(返回数据)))
        res.send(返回数据)

        break
      }
    }
  }
}
