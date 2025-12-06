import type { Request, Response } from 'express'

/**
 * 描述接口如何将转换器转换后的数据发送给客户端
 *
 * 这一层的存在使得数据格式和传输方式完全解耦:
 * - 相同的数据可以通过 JSON, XML, Protobuf 等不同格式发送
 * - 可以选择不同的传输方式: HTTP 响应, WebSocket, SSE, 文件下载等
 * - 可以设置相应头等数据
 */
export abstract class 接口结果返回器<接口正确形式> {
  public abstract 返回(req: Request, res: Response, 结果: 接口正确形式): void | Promise<void>
}

export type 任意接口结果返回器 = 接口结果返回器<any>

/**
 * 常用返回器: 直接使用 res.send 发送数据
 */
export class 常用返回器<正确形式> extends 接口结果返回器<正确形式> {
  public override 返回(req: Request, res: Response, 结果: 正确形式): void {
    res.send(结果)
  }
}

/**
 * 自定义返回器: 支持任意自定义的返回逻辑
 */
export class 自定义返回器<正确形式> extends 接口结果返回器<正确形式> {
  public constructor(private 实现函数: (req: Request, res: Response, 结果: 正确形式) => void | Promise<void>) {
    super()
  }

  public override 返回(req: Request, res: Response, 结果: 正确形式): void | Promise<void> {
    return this.实现函数(req, res, 结果)
  }
}
