import { WebSocket } from 'ws'

type id = string

export class WebSocket管理者 {
  private 清理函数表: Record<string, () => Promise<void>> = {}

  constructor(private 连接表: Record<id, WebSocket | null>) {}

  async 增加连接(id: id, ws句柄: WebSocket): Promise<void> {
    this.连接表[id] = ws句柄
  }
  async 查询连接存在(id: string): Promise<boolean> {
    return this.连接表.hasOwnProperty(id) ? true : false
  }
  async 设置清理函数(id: string, 清理函数: () => Promise<void>): Promise<void> {
    if (this.连接表.hasOwnProperty(id) === false) return
    this.清理函数表[id] = 清理函数
  }
  async 获得句柄(id: id): Promise<WebSocket | null> {
    return this.连接表[id] ?? null
  }
  async 删除连接(id: string): Promise<void> {
    let 清理函数 = this.清理函数表[id]
    await 清理函数?.()
    delete this.连接表[id]
    delete this.清理函数表[id]
  }
}
