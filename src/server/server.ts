import { Log } from '@lsby/ts-log'
import type { Request, Response } from 'express'
import express from 'express'
import { readFile } from 'node:fs/promises'
import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import short from 'short-uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { z } from 'zod'
import { Global } from '../global/global'
import { 递归截断字符串 } from '../help/interior'
import { 任意接口 } from '../interface/interface-base'
import { 任意接口逻辑 } from '../interface/interface-logic'
import { 任意接口结果转换器 } from '../interface/interface-result'

export type 请求附加参数类型 = {
  log: Log
}

export class 服务器 {
  private log = Global.getItem('log')

  public constructor(
    private 接口们: 任意接口[],
    private 端口: number,
    private 静态资源路径?: string,
    private 默认get文件路径?: string,
  ) {}

  public async run(): Promise<{
    ip: string[]
    api: string[]
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  }> {
    let log = (await this.log).extend('服务器')

    let app = express()

    if (this.静态资源路径 !== void 0) {
      await log.debug(`设置静态资源路径: ${this.静态资源路径}`)
      app.use(express.static(this.静态资源路径))
    }
    app.use(this.处理请求.bind(this))

    let server = app.listen(this.端口)
    await this.初始化WebSocket(server)

    return { ip: this.获取本地地址(), api: this.接口们.map((a) => a.获得路径() as string), server }
  }

  private async 处理请求(req: Request, res: Response): Promise<void> {
    let 请求id = short().new()
    let 主log = (await this.log).extend(请求id)

    let log = 主log.extend('控制器')

    try {
      let { path: 请求路径, method } = req
      let 请求方法 = method.toLowerCase()

      await log.debug('收到请求, 路径: %o, 方法: %o', 请求路径, 请求方法)

      // 匹配接口
      let 目标接口 = this.接口们.find((接口) => 请求方法 === 接口.获得方法() && 请求路径 === 接口.获得路径()) ?? null
      if (目标接口 !== null) {
        await this.处理接口逻辑(req, res, 目标接口, { log: 主log })
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

  private async 处理接口逻辑(
    req: Request,
    res: Response,
    目标接口: 任意接口,
    请求附加参数: 请求附加参数类型,
  ): Promise<void> {
    let log = 请求附加参数.log.extend('处理接口逻辑')

    let 接口逻辑 = 目标接口.获得逻辑() as 任意接口逻辑
    let 结果转换器 = 目标接口.获得结果转换器() as 任意接口结果转换器

    await log.debug('调用接口逻辑...')
    let 接口结果 = await 接口逻辑.运行(req, res, {}, 请求附加参数)
    await log.debug('接口逻辑执行完毕')

    let 最终结果: unknown
    let 转换结果 = 结果转换器.实现(接口结果) as unknown
    let 错误结果 = (目标接口.获得接口错误形式Zod() as z.ZodTypeAny).safeParse(转换结果)
    let 正确结果 = (目标接口.获得接口正确形式Zod() as z.ZodTypeAny).safeParse(转换结果)

    if (错误结果.success === true) {
      最终结果 = 错误结果.data
    } else if (正确结果.success === true) {
      最终结果 = 正确结果.data
    } else {
      await log.error('转换结果无法通过校验')
      await log.error('对于错误结果: %o', 错误结果.error)
      await log.error('对于正确结果: %o', 正确结果.error)
      throw new Error(`转换结果无法通过校验: ${JSON.stringify(递归截断字符串(转换结果))}`)
    }
    await log.debug('最终结果: %o', 最终结果)

    res.send(最终结果)
    await log.debug('返回逻辑执行完毕')
  }

  private async 初始化WebSocket(server: http.Server): Promise<void> {
    let wss = new WebSocketServer({ server })
    let logBase = await this.log

    wss.on('listening', async () => {
      let log = logBase
      await log.info('WebSocket 服务器已启动并监听')
    })

    wss.on('error', async (err) => {
      let log = logBase
      await log.error('WebSocket 服务器发生错误: %o', err)
    })

    wss.on('connection', async (ws: WebSocket, req) => {
      let log = logBase.extend(short().new()).extend('WebSocket')
      await log.debug('收到 WebSocket 连接请求: %o', req.url)

      let 客户端id = req.url?.split('?id=')[1] ?? null

      if (客户端id === null) {
        await log.error('连接请求缺少客户端 ID')
        return this.关闭WebSocket连接(ws, log, 4001, '缺少客户端 ID')
      }

      await log.debug('解析客户端 ID: %s', 客户端id)

      let WebSocket管理器 = await Global.getItem('WebSocket管理器')
      let 连接已存在 = await WebSocket管理器.查询连接存在(客户端id)

      if (连接已存在) {
        await log.error('客户端 ID 已存在: %s', 客户端id)
        return this.关闭WebSocket连接(ws, log, 4002, '客户端 ID 已存在')
      }

      await WebSocket管理器.增加连接(客户端id, ws)
      await log.info('WebSocket 连接已建立, 客户端 ID: %s', 客户端id)

      ws.on('close', async () => {
        await log.info('WebSocket 连接关闭: %s', 客户端id)
        await WebSocket管理器.删除连接(客户端id)
      })

      ws.on('error', async (err) => {
        await log.error('WebSocket 出现错误, 客户端 ID: %s, 错误: %o', 客户端id, err)
        await WebSocket管理器.删除连接(客户端id)
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
