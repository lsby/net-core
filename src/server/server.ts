import { Log } from '@lsby/ts-log'
import type { Request, Response } from 'express'
import express from 'express'
import { readFile } from 'node:fs/promises'
import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import short from 'short-uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { Global } from '../global/global'
import { 任意接口 } from '../interface/interface-base'
import { 任意接口逻辑 } from '../interface/interface-logic'
import { 任意接口结果转换器 } from '../interface/interface-result'
import { 递归截断字符串 } from '../tools/tools'

export class 服务器 {
  private log = Global.getItem('log')

  constructor(
    private 接口们: 任意接口[],
    private 端口: number,
    private 静态资源路径?: string,
    private 默认get文件路径?: string,
  ) {}

  async run(): Promise<{
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
    let log = (await this.log).extend(请求id).extend('控制器')

    try {
      let { path: 请求路径, method } = req
      let 请求方法 = method.toLowerCase()

      await log.debug('收到请求, 路径: %o, 方法: %o', 请求路径, 请求方法)

      // 匹配接口
      let 目标接口 = this.接口们.find((接口) => 请求方法 === 接口.获得方法() && 请求路径 === 接口.获得路径()) ?? null
      if (目标接口 !== null) {
        await this.处理接口逻辑(req, res, log, 目标接口, 请求id)
        return
      }

      // 静态资源处理
      let 静态资源路径 = this.静态资源路径 ?? null
      if (静态资源路径 !== null && 请求方法 === 'get' && (await this.处理静态资源(req, res, log))) {
        return
      }

      // 处理默认get文件
      if (this.默认get文件路径 !== void 0 && 请求方法 === 'get') {
        try {
          let 默认文件内容 = await readFile(this.默认get文件路径, { encoding: 'utf-8' })
          res.send(默认文件内容)
          return
        } catch (e) {
          await log.error('返回默认get文件内容失败: %o', String(e))
        }
      }

      // 未命中资源
      await log.debug('没有命中任何资源')
      res.status(404).end()
    } catch (error) {
      await log.error(error)
      res.status(500).send('服务器内部错误')
    }
  }

  private async 处理静态资源(req: Request, res: Response, log: Log): Promise<boolean> {
    let 静态资源路径 = this.静态资源路径 ?? null
    let 命中 = false

    if (静态资源路径 !== null) {
      await new Promise<void>((resolve) => {
        express.static(静态资源路径, {
          setHeaders: async () => {
            await log.debug('命中静态资源')
            命中 = true
            resolve()
          },
        })(req, res, () => resolve())
      })
    } else {
      await log.debug('没有命中静态资源')
    }

    return 命中
  }

  private async 处理接口逻辑(req: Request, res: Response, log: Log, 目标接口: 任意接口, 请求id: string): Promise<void> {
    let 接口逻辑 = 目标接口.获得逻辑() as 任意接口逻辑
    let 结果转换器 = 目标接口.获得结果转换器() as 任意接口结果转换器

    await log.debug('调用接口逻辑...')
    let 接口结果 = await 接口逻辑.运行(req, res, {}, { 请求id })
    await log.debug('接口逻辑执行完毕')

    let 最终结果 = 结果转换器.实现(接口结果) as unknown
    await log.debug('返回数据: %o', JSON.stringify(递归截断字符串(最终结果)))

    res.send(最终结果)
    await log.debug('返回逻辑执行完毕')
  }

  private async 初始化WebSocket(server: http.Server): Promise<void> {
    let wss = new WebSocketServer({ server })
    let logBase = (await this.log).extend('web-socket')

    wss.on('connection', async (ws: WebSocket, req) => {
      let log = logBase.extend(short().new()).extend('WebSocket')
      await log.debug('收到 WebSocket 连接请求: %o', req.url)

      let 客户端id = req.url?.split('?id=')[1] ?? null
      if (客户端id === null) {
        await log.error('缺少客户端id')
        return this.关闭WebSocket连接(ws, log, 1011, '缺少客户端id')
      }

      let WebSocket管理器 = await Global.getItem('WebSocket管理器')
      log = log.extend(客户端id)
      await log.debug('成功解析客户端id')

      await WebSocket管理器.增加或替换连接(客户端id, ws)
      await log.info('WebSocket 连接已建立')

      await WebSocket管理器.取消标记连接已断开(客户端id)

      ws.on('close', async () => {
        await WebSocket管理器.标记连接已断开(客户端id)
      })

      ws.on('error', async (err) => {
        await log.error('WebSocket 出现错误: %o', String(err))
        await WebSocket管理器.标记连接已错误(客户端id)
      })
    })

    wss.on('listening', async () => {
      let log = logBase
      await log.info('WebSocket 服务器已启动并监听')
    })

    wss.on('error', async (err) => {
      let log = logBase
      await log.error('WebSocket 服务器发生错误: %o', err)
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
