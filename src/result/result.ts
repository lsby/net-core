import type { Request, Response } from 'express'
import { GlobalLog } from '../global/global'
import { 类型保持符号 } from '../types/type-hold'

export abstract class 结果<T> {
  declare [类型保持符号]: T
  abstract run(req: Request, res: Response): Promise<void>
}

// ======================

export abstract class 成功结果<T> extends 结果<T> {
  private 成功结果烙印 = true
}

export class 成功JSON结果<Data extends Record<string, unknown>> extends 成功结果<Data> {
  private log = GlobalLog.getInstance().extend('SuccessResultJson')

  constructor(private data: Data) {
    super()
    this.log.debug('创建返回数据: %o', data)
  }

  async run(req: Request, res: Response): Promise<void> {
    this.log.debug('返回数据: %o', this.data)
    res.send(this.data)
  }
}

export class 成功自定义结果 extends 成功结果<unknown> {
  constructor(private customHandler: (req: Request, res: Response) => Promise<void>) {
    super()
  }

  async run(req: Request, res: Response): Promise<void> {
    await this.customHandler(req, res)
  }
}

// ======================

export abstract class ErrorResult<T> extends 结果<T> {
  private 失败结果烙印 = true
}

export class 失败JSON结果<Data> extends ErrorResult<Data> {
  private log = GlobalLog.getInstance().extend('ErrorResultJson')

  constructor(private data: Data) {
    super()
    this.log.debug('创建返回数据: %o', data)
  }

  async run(req: Request, res: Response): Promise<void> {
    this.log.debug('返回数据: %o', this.data)
    res.send(this.data)
  }
}
