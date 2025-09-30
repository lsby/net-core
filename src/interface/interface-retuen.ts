import type { Request, Response } from 'express'

export abstract class 接口结果返回器<接口正确形式> {
  public abstract 返回(req: Request, res: Response, 结果: 接口正确形式): void | Promise<void>
}

export type 任意接口结果返回器 = 接口结果返回器<any>

export class 常用返回器<正确形式> extends 接口结果返回器<正确形式> {
  public override 返回(req: Request, res: Response, 结果: 正确形式): void {
    res.send(结果)
  }
}

export class 自定义返回器<正确形式> extends 接口结果返回器<正确形式> {
  public constructor(private 实现函数: (req: Request, res: Response, 结果: 正确形式) => void | Promise<void>) {
    super()
  }

  public override 返回(req: Request, res: Response, 结果: 正确形式): void | Promise<void> {
    return this.实现函数(req, res, 结果)
  }
}
