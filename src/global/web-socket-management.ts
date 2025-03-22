import { WebSocket } from 'ws'
import { Global } from './global'

export class WebSocket管理器 {
  private log = Global.getItem('log').then((a) => a.extend('WebSocket管理器'))
  private 连接表: Record<
    string,
    {
      ws: WebSocket | null
      缓存: any[]
      已完成: boolean
      已断开: boolean
      已错误: boolean
      数据发送中: boolean
      缓存发送中: boolean
      清理函数?: () => Promise<void>
      超时定时器?: NodeJS.Timeout
    }
  > = {}

  private async 关闭并删除连接(id: string, code: number, 说明: string): Promise<void> {
    let log = (await this.log).extend('关闭并删除连接').extend(id)

    try {
      await this.连接表[id]?.清理函数?.()
    } catch (err) {
      await log.error(`执行清理函数失败: %o.`, String(err))
    }

    this.连接表[id]?.ws?.close(code, 说明)
    delete this.连接表[id]
  }
  private async 销毁判定(id: string): Promise<void> {
    let log = (await this.log).extend('销毁判定').extend(id)

    let 连接 = this.连接表[id]
    if (连接 === void 0) {
      await log.error(`无法找到连接`)
      return
    }

    if (连接.已错误 === true) {
      await log.error(`连接已被标记为错误, 断开连接.`)
      clearTimeout(连接.超时定时器)
      await this.关闭并删除连接(id, 1011, '发生错误')
      return
    }

    if (连接.已完成 === true && 连接.缓存.length === 0) {
      await log.debug(`连接已完成, 正常关闭.`)
      await this.关闭并删除连接(id, 1000, '正常关闭')
      return
    }

    if (连接.已断开 === false) {
      clearTimeout(连接.超时定时器)
    }
    if (连接.已断开 === true) {
      await log.debug('连接已断开, 等待客户端重连.')
      let 超时时间 = 30000
      clearTimeout(连接.超时定时器)
      连接.超时定时器 = setTimeout(async () => {
        if (this.连接表[id]?.已断开 === true) {
          await log.error('客户端超时未重连，清理连接.')
          await this.关闭并删除连接(id, 1011, '客户端超时未重连，清理连接')
        }
      }, 超时时间)
    }
  }

  async 增加或替换连接(id: string, ws: WebSocket): Promise<void> {
    let log = (await this.log).extend('增加或替换连接').extend(id)

    if (this.连接表[id] === void 0) {
      this.连接表[id] = {
        ws,
        缓存: [],
        已完成: false,
        已断开: false,
        已错误: false,
        数据发送中: false,
        缓存发送中: false,
      }
      return
    }

    let 旧句柄 = this.连接表[id].ws

    await log.info('旧连接存在, 将替换表中数据, 并关闭旧ws句柄.')
    this.连接表[id].ws = ws
    this.连接表[id].已完成 = false
    this.连接表[id].已断开 = false
    this.连接表[id].已错误 = false
    this.连接表[id].数据发送中 = false
    this.连接表[id].缓存发送中 = false
    旧句柄?.close(1006, '新连接替换旧连接')

    await log.info('发送旧连接缓存')
    this.连接表[id].缓存发送中 = true
    while (this.连接表[id].缓存.length !== 0) {
      await this.发送信息_内部(id, this.连接表[id].缓存.shift())
    }
    this.连接表[id].缓存发送中 = false
    await log.info('发送旧连接缓存完成')
  }
  async 设置清理函数(id: string, 清理函数: () => Promise<void>): Promise<void> {
    let log = (await this.log).extend('设置清理函数').extend(id)
    if (this.连接表[id] === void 0) {
      await log.error(`无法找到连接`)
      return
    }
    this.连接表[id].清理函数 = 清理函数
  }

  private async 发送信息_内部(id: string, data: any): Promise<void> {
    let log = (await this.log).extend('发送信息(内部)').extend(id)

    while (this.连接表[id]?.数据发送中 === true) {
      await log.info('数据发送中, 将退避.')
      let 退避时间 = 100
      await new Promise<void>((res, _rej) => setTimeout(() => res(), 退避时间))
    }

    let 连接 = this.连接表[id]
    if (连接 === void 0) {
      await log.error('无法找到连接')
      return
    }

    await new Promise<void>((res, rej) => {
      连接.数据发送中 = true

      let ws句柄 = 连接.ws
      if (ws句柄 === null) {
        log.error('无法找到ws句柄').catch(console.error)
        return
      }

      ws句柄.send(JSON.stringify(data), (err) => {
        if ((err ?? null) !== null) {
          log.error(err).catch(console.error)
          return rej(err)
        }
        log.debug('WebSocket 信息发送成功').catch(console.error)
        return res()
      })
    }).finally(() => {
      连接.数据发送中 = false
    })
  }
  async 发送信息(id: string, data: any): Promise<void> {
    let log = (await this.log).extend('发送信息').extend(id)

    if (this.连接表[id]?.已完成 === true) {
      await log.error('连接已完成, 无法发送数据.')
      return
    }
    if (this.连接表[id]?.已断开 === true) {
      await log.error('连接已断开, 将缓存数据.')
      this.连接表[id].缓存.push(data)
      return
    }

    while (this.连接表[id]?.缓存发送中 === true) {
      await log.info('缓存发送中, 将退避.')
      let 退避时间 = 100
      await new Promise<void>((res, _rej) => setTimeout(() => res(), 退避时间))
    }

    await this.发送信息_内部(id, data)
  }

  async 标记连接已完成(id: string): Promise<void> {
    if (this.连接表[id] === void 0) return
    this.连接表[id].已完成 = true
    await this.销毁判定(id)
  }

  async 标记连接已断开(id: string): Promise<void> {
    if (this.连接表[id] === void 0) return
    this.连接表[id].已断开 = true
    await this.销毁判定(id)
  }
  async 取消标记连接已断开(id: string): Promise<void> {
    if (this.连接表[id] === void 0) return
    this.连接表[id].已断开 = false
    await this.销毁判定(id)
  }

  async 标记连接已错误(id: string): Promise<void> {
    if (this.连接表[id] === void 0) return
    this.连接表[id].已错误 = true
    await this.销毁判定(id)
  }
}
