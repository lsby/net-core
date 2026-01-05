import { Either } from '@lsby/ts-fp-data'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { 接口返回器 } from '../interface/interface-returner'
import { 请求附加参数类型 } from '../server/server'

export class 自定义接口返回器<
  实现错误类型Zod extends z.ZodTypeAny,
  实现正确类型Zod extends z.ZodTypeAny,
  接口错误类型Zod extends z.ZodTypeAny,
  接口正确类型Zod extends z.ZodTypeAny,
> extends 接口返回器<
  z.infer<实现错误类型Zod>,
  z.infer<实现正确类型Zod>,
  z.infer<接口错误类型Zod>,
  z.infer<接口正确类型Zod>
> {
  public constructor(
    private 实现错误类型Zod: 实现错误类型Zod,
    private 实现正确类型Zod: 实现正确类型Zod,
    private 接口错误类型Zod: 接口错误类型Zod,
    private 接口正确类型Zod: 接口正确类型Zod,
    private 实现函数: (
      req: Request,
      res: Response,
      数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
      请求附加参数: 请求附加参数类型,
    ) => void,
  ) {
    super()
  }

  public override 实现(
    req: Request,
    res: Response,
    数据: Either<z.infer<实现错误类型Zod>, z.infer<实现正确类型Zod>>,
    请求附加参数: 请求附加参数类型,
  ): void {
    this.实现函数(req, res, 数据, 请求附加参数)
  }
}
