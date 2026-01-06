import { Log } from '@lsby/ts-log'
import type { Request, Response } from 'express'
import express from 'express'
import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import short from 'short-uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { 全局日志单例 } from '../global/log'
import { WebSocket管理器 } from '../global/model/web-socket'
import { 全局WebSocket管理器单例 } from '../global/web-socket'
import { 任意接口 } from '../interface/interface-base'
import { 任意接口逻辑 } from '../interface/interface-logic'

export type 日志回调类型 = (
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
  namespace: string,
  content: string,
) => Promise<void>

export type 请求附加参数类型 = { log: Log; 请求id: string; webSocket管理器: WebSocket管理器 }

export class 服务器 {
  private log: Log
  private 日志回调?: 日志回调类型 | undefined
  private 接口们: 任意接口[]
  private 端口: number

  public constructor(options: { 接口们: 任意接口[]; 端口: number; 日志回调?: 日志回调类型 }) {
    this.接口们 = options.接口们
    this.端口 = options.端口
    this.日志回调 = options.日志回调
    this.log = 全局日志单例
    if (this.日志回调 !== void 0) this.log = this.log.pipe(this.日志回调)
  }

  public async run(): Promise<{
    ip: string[]
    api: string[]
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  }> {
    let app = express()
    app.use(this.处理请求.bind(this))

    let server = app.listen(this.端口)
    await this.初始化WebSocket(server)

    return { ip: this.获取本地地址(), api: this.接口们.map((a) => a.获得路径() as string), server }
  }

  private async 处理请求(req: Request, res: Response): Promise<void> {
    let 请求id = short().new()
    let log = this.log.extend(请求id)
    let 请求附加参数: 请求附加参数类型 = { log: log, 请求id: 请求id, webSocket管理器: 全局WebSocket管理器单例 }

    let 开始时间 = Date.now()

    try {
      let { path: 请求路径, method } = req
      请求路径 = decodeURIComponent(请求路径)
      let 请求方法 = method.toLowerCase()

      await log.debug('收到请求, 路径: %o, 方法: %o', 请求路径, 请求方法)

      // 匹配接口
      let 目标接口 = this.接口们.find((接口) => 请求方法 === 接口.获得方法() && 接口.匹配路径(请求路径)) ?? null
      if (目标接口 !== null) {
        await this.处理接口逻辑({ req, res, 目标接口, 请求附加参数 })
        return
      }

      // 未命中资源
      await log.debug('没有命中任何资源')
      res.status(404).end()
    } catch (error) {
      await log.error(error)
      res.setHeader('Content-Type', 'text/html')
      res.status(500).send('Internal Server Error')
    } finally {
      let 耗时ms = Date.now() - 开始时间
      await log.info('请求完成, 耗时: %o ms', 耗时ms)
    }
  }

  private async 处理接口逻辑(opt: {
    req: Request
    res: Response
    目标接口: 任意接口
    请求附加参数: 请求附加参数类型
  }): Promise<void> {
    let { req, res, 目标接口, 请求附加参数 } = opt
    let log = 请求附加参数.log

    let 接口逻辑 = 目标接口.获得逻辑() as 任意接口逻辑
    let 接口返回器 = 目标接口.获得接口返回器()

    let 总开始 = Date.now()

    // ---------- 接口逻辑 ----------
    let 开始 = Date.now()
    await log.debug('调用接口逻辑...')

    let 插件们 = 接口逻辑.获得插件们()

    await log.debug('找到 %o 个 插件, 准备执行...', 插件们.length)
    let 插件结果 = await 接口逻辑.计算插件结果(req, res, 请求附加参数)
    await log.debug('插件 执行完毕')

    await log.debug('准备执行接口实现...')
    let 接口结果 = await 接口逻辑.通过插件结果运行(插件结果, {}, 请求附加参数)
    await log.debug('接口实现执行完毕')

    let 接口耗时 = Date.now() - 开始
    await log.info('接口逻辑执行完毕, 耗时: %o ms', 接口耗时)

    // ---------- 接口返回器 ----------
    开始 = Date.now()
    接口返回器.实现(req, res, 接口结果, 请求附加参数)
    let 返回耗时 = Date.now() - 开始
    await log.info('返回逻辑执行完毕, 耗时: %o ms', 返回耗时)

    // ---------- 总耗时 ----------
    let 总耗时 = Date.now() - 总开始
    await log.info('接口完整执行耗时: %o ms', 总耗时)
  }

  private async 初始化WebSocket(server: http.Server): Promise<void> {
    let log = this.log

    let wss = new WebSocketServer({ server })
    wss.on('listening', async () => {
      await log.info('WebSocket 服务器已启动并监听')
    })

    wss.on('error', async (err) => {
      await log.error('WebSocket 服务器发生错误: %o', err)
    })

    wss.on('connection', async (ws: WebSocket, req) => {
      let 连接log = log.extend(short().new())
      await 连接log.debug('收到 WebSocket 连接请求: %o', req.url)

      let 客户端id = req.url?.split('?id=')[1] ?? null
      if (客户端id === null) {
        await 连接log.error('连接请求缺少客户端 ID')
        return this.关闭WebSocket连接(ws, 连接log, 4001, '缺少客户端 ID')
      }
      await 连接log.debug('解析客户端 ID: %s', 客户端id)

      let WebSocket管理器 = 全局WebSocket管理器单例

      let 连接已存在 = WebSocket管理器.查询连接存在(客户端id)
      if (连接已存在) {
        await 连接log.error('客户端 ID 已存在: %s', 客户端id)
        return this.关闭WebSocket连接(ws, 连接log, 4002, '客户端 ID 已存在')
      }

      WebSocket管理器.增加连接(客户端id, ws)
      await 连接log.info('WebSocket 连接已建立, 客户端 ID: %s', 客户端id)

      ws.on('close', async () => {
        await 连接log.info('WebSocket 连接关闭: %s', 客户端id)
        WebSocket管理器.删除连接(客户端id)
      })

      ws.on('error', async (err) => {
        await 连接log.error('WebSocket 出现错误, 客户端 ID: %s, 错误: %o', 客户端id, err)
        WebSocket管理器.删除连接(客户端id)
      })
    })
  }

  private async 关闭WebSocket连接(ws: WebSocket, log: Log, code: number, reason: string): Promise<void> {
    await log.debug(`关闭 WebSocket 连接, 代码: ${code}, 原因: ${reason}`)
    ws.close(code, reason)
  }

  private 获取本地地址(): string[] {
    return Object.values(networkInterfaces())
      .flatMap((iface) => iface ?? [])
      .map((address) => `http://${address.address}:${this.端口}`)
  }
}
