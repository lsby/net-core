import { WebSocket } from 'ws'

type 请求id = string

export class WebSocket管理者 {
  constructor(private 连接表: Record<请求id, WebSocket | null>) {}

  async 增加连接(请求id: 请求id, ws句柄: WebSocket): Promise<void> {
    this.连接表[请求id] = ws句柄
  }
  async 查询连接存在(请求id: string): Promise<boolean> {
    return this.连接表[请求id] === null ? false : true
  }
  async 获得句柄(请求id: 请求id): Promise<WebSocket | null> {
    return this.连接表[请求id] ?? null
  }
  async 删除连接(id: string): Promise<void> {
    delete this.连接表[id]
  }
}
