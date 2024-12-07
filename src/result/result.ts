import type { Request, Response } from 'express'
import { Global } from '../global/global'
import { 附加参数类型 } from '../plugin/plug'
import { 递归截断字符串 } from '../tools/tools'

export abstract class 结果<T> {
  protected declare readonly __类型保持符号?: T
  abstract run(req: Request, res: Response, 附加参数: 附加参数类型): Promise<void>
}

// ======================

export abstract class 正确结果<T> extends 结果<T> {
  private 正确结果烙印 = true
}

export class 正确JSON结果<Data extends Record<string, unknown>> extends 正确结果<Data> {
  private log = Global.getItem('log')

  constructor(private data: Data) {
    super()
  }

  async run(req: Request, res: Response, 附加参数: 附加参数类型): Promise<void> {
    let log = (await this.log).extend(附加参数.请求id).extend('正确JSON结果')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    await log.debug('返回数据: %o', 递归截断字符串(this.data))
    res.send(this.data)
  }
}

export class 正确自定义结果 extends 正确结果<unknown> {
  constructor(private customHandler: (req: Request, res: Response) => Promise<void>) {
    super()
  }

  async run(req: Request, res: Response): Promise<void> {
    return this.customHandler(req, res)
  }
}

// ======================

export abstract class 错误结果<T> extends 结果<T> {
  private 错误结果烙印 = true
}

export class 错误JSON结果<Data> extends 错误结果<Data> {
  private log = Global.getItem('log')

  constructor(private data: Data) {
    super()
  }

  async run(req: Request, res: Response, 附加参数: 附加参数类型): Promise<void> {
    let log = (await this.log).extend(附加参数.请求id).extend('错误JSON结果')
    await log.debug('返回数据: %o', 递归截断字符串(this.data))
    res.send(this.data)
  }
}
