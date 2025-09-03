import { WebSocket } from 'ws'
import { Global } from './global'

type id = string

export class WebSocket管理器 {
  private log = Global.getItem('log').then((a) => a.extend('@lsby:net-core').extend('WebSocket管理器'))
  private 清理函数表: Record<string, () => Promise<void>> = {}

  public constructor(private 连接表: Record<id, WebSocket | null>) {}

  public async 增加连接(id: id, ws句柄: WebSocket): Promise<void> {
    this.连接表[id] = ws句柄
  }
  public async 查询连接存在(id: string): Promise<boolean> {
    return this.连接表.hasOwnProperty(id) ? true : false
  }
  public async 设置清理函数(id: string, 清理函数: () => Promise<void>): Promise<void> {
    if (this.连接表.hasOwnProperty(id) === false) return
    this.清理函数表[id] = 清理函数
  }
  public async 获得句柄(id: id): Promise<WebSocket | null> {
    return this.连接表[id] ?? null
  }
  public async 删除连接(id: string): Promise<void> {
    let log = await this.log
    let 清理函数 = this.清理函数表[id]

    try {
      this.连接表[id]?.close(1000, '服务器主动关闭')
    } catch (err) {
      await log.error(`关闭 WebSocket 句柄失败, id: ${id}, 错误: ${err}`)
    }

    try {
      await 清理函数?.()
    } catch (err) {
      await log.error(`清理连接失败, id: ${id}, 错误: ${err}`)
    }

    delete this.连接表[id]
    delete this.清理函数表[id]
  }
}
