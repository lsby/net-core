import { GlobalItem, GlobalService } from '@lsby/ts-global'
import { Log } from '@lsby/ts-log'
import { WebSocket } from 'ws'

let log = new Log('@lsby:net-core')

type id = string
export class WebSocket管理器 {
  private log = log.extend('@lsby:net-core').extend('WebSocket管理器')
  private 清理函数表: Record<string, () => Promise<void>> = {}
  private 定时器ID: NodeJS.Timeout | null = null

  public constructor(private 连接表: Record<id, WebSocket | null>) {
    this.定时器ID = setInterval((): void => {
      this.清理无效连接().catch((err): void => {
        this.log
          .error(`清理无效连接失败: ${err}`)
          .catch((a) => `日志输出错误: ${a}: 日志内容: ${`清理无效连接失败: ${err}`}`)
      })
    }, 30000)
  }

  public 增加连接(id: id, ws句柄: WebSocket): void {
    this.连接表[id] = ws句柄
  }
  public 查询连接存在(id: string): boolean {
    return this.连接表.hasOwnProperty(id) ? true : false
  }
  public async 设置清理函数(id: string, 清理函数: () => Promise<void>): Promise<void> {
    if (this.连接表.hasOwnProperty(id) === false) return
    this.清理函数表[id] = 清理函数
  }
  public async 获得句柄(id: id): Promise<WebSocket | null> {
    return this.连接表[id] ?? null
  }
  public 删除连接(id: string): void {
    let 清理函数 = this.清理函数表[id]

    try {
      this.连接表[id]?.close(1000, '服务器主动关闭')
    } catch (err) {
      this.log
        .error(`关闭 WebSocket 句柄失败, id: ${id}, 错误: ${err}`)
        .catch((a) => `日志输出错误: ${a}: 日志内容: ${`关闭 WebSocket 句柄失败, id: ${id}, 错误: ${err}`}`)
    }

    清理函数?.().catch((err) => this.log.error(`清理连接失败, id: ${id}, 错误: ${err}`))

    delete this.连接表[id]
    delete this.清理函数表[id]
  }

  private async 清理无效连接(): Promise<void> {
    let 清理数量 = 0
    for (let [id, ws] of Object.entries(this.连接表)) {
      if (ws === null || ws.readyState === WebSocket.CLOSED) {
        this.删除连接(id)
        清理数量++
      }
    }
    if (清理数量 > 0) {
      await this.log.info(`清理了 ${清理数量} 个无效 WebSocket 连接`)
    }
  }
}

export let Global = new GlobalService([
  new GlobalItem('log', log),
  new GlobalItem('WebSocket管理器', new WebSocket管理器({})),
])
