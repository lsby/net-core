import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 插件 } from '../interface/interface-plugin'
import { 请求附加参数类型 } from '../types/types'

export class 自定义插件<
  错误类型描述 extends z.ZodObject<{ code: z.ZodLiteral<number>; data: z.ZodTypeAny }> | z.ZodNever,
  正确类型描述 extends z.AnyZodObject,
> extends 插件<错误类型描述, 正确类型描述> {
  public constructor(
    错误类型描述: 错误类型描述,
    正确类型描述: 正确类型描述,
    实现: (
      req: Request,
      res: Response,
      附加参数: 请求附加参数类型,
    ) => Promise<Either<z.infer<错误类型描述>, z.infer<正确类型描述>>>,
  ) {
    super(错误类型描述, 正确类型描述, 实现)
  }
}
