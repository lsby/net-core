import { WebSocket } from 'ws'
import { 全局日志单例 } from '../log'
import { 集线器模型, 集线器监听器持有者 } from './hub'

type id = string
export class WebSocket管理器 {
  private log = 全局日志单例.extend('WebSocket管理器')
  private 连接表: Record<id, WebSocket | null> = {}
  private 消息监听表: Record<id, 集线器模型<unknown>> = {}
  private 连接清理模型: 集线器模型<void> = new 集线器模型()
  private 连接持有者表: Record<id, 集线器监听器持有者<void>> = {}
  private 清理函数表: Record<id, () => Promise<void>> = {}

  public 增加连接(id: id, ws句柄: WebSocket): 集线器监听器持有者<void> {
    // 移除旧 ws
    if (id in this.连接表) this.删除连接(id)
    this.连接表[id] = ws句柄

    // 初始化消息模型
    if (!(id in this.消息监听表)) {
      let 模型 = new 集线器模型<unknown>()
      模型.设置错误处理器(async (数据, 索引, 错误) => {
        await this.log.warn(`WebSocket 监听器执行失败, id: ${id}, 索引: ${索引}, 错误: ${错误}`)
      })
      this.消息监听表[id] = 模型
    }

    this.注册onmessage(id, ws句柄)

    let 持有者 = this.连接清理模型.添加监听器(async () => {
      if (id in this.连接表) this.删除连接(id)
    })
    this.连接持有者表[id] = 持有者
    return 持有者
  }
  public 删除连接(id: string): void {
    let ws = this.连接表[id]
    if (ws !== null && ws !== void 0) {
      ws.onmessage = null
      ws.once('error', (err) => void this.log.error(`WebSocket 异步错误, id: ${id}, 错误: ${err}`))
      ws.once(
        'close',
        (code, reason) => void this.log.debug(`WebSocket 已关闭, id: ${id}, 关闭码: ${code}, 原因: ${reason}`),
      )
      try {
        ws.close(1000, '服务器主动关闭')
      } catch (err) {
        void this.log.error(`WebSocket 同步关闭失败, id: ${id}, 错误: ${err}`)
      }
    }

    let 清理函数 = this.清理函数表[id]
    if (清理函数 !== void 0) void 清理函数().catch((err) => this.log.error(`清理连接失败, id: ${id}, 错误: ${err}`))

    delete this.连接表[id]
    delete this.清理函数表[id]
    delete this.消息监听表[id]

    let 持有者 = this.连接持有者表[id]
    if (持有者 !== void 0) {
      this.连接清理模型.移除监听器(持有者)
      delete this.连接持有者表[id]
    }
  }

  private 注册onmessage(id: id, ws句柄: WebSocket): void {
    ws句柄.onmessage = async (event): Promise<void> => {
      try {
        let 数据: unknown = JSON.parse(event.data.toString())
        let 模型 = this.消息监听表[id]
        if (模型 !== void 0) await 模型.广播(数据)
      } catch (err) {
        await this.log.warn(`WebSocket 消息处理失败, id: ${id}, 错误: ${err}`)
      }
    }
  }

  public 查询连接存在(id: string): boolean {
    return id in this.连接表
  }
  public async 获得ws句柄(id: id): Promise<WebSocket | null> {
    return this.连接表[id] ?? null
  }

  public async 设置清理函数(id: string, 清理函数: () => Promise<void>): Promise<void> {
    if (id in this.连接表) this.清理函数表[id] = 清理函数
  }
  public 设置消息监听(id: string, 回调函数: (数据: any) => Promise<void>): 集线器监听器持有者<unknown> | null {
    let 模型 = this.消息监听表[id]
    if (模型 === void 0) return null
    return 模型.添加监听器(回调函数)
  }
}
