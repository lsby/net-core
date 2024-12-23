import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import type { Request, Response } from 'express'
import express from 'express'
import short from 'short-uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { Global } from '../global/global'
import { 任意接口, 接口方法类型, 接口路径类型 } from '../interface/interface-base'
import { 任意的接口逻辑 } from '../interface/interface-logic'
import { 任意的接口结果转换器 } from '../interface/interface-result'
import { 递归截断字符串 } from '../tools/tools'

export class 服务器 {
  private log = Global.getItem('log')

  constructor(
    private 接口们: 任意接口[],
    private 端口: number,
    private 静态资源路径?: string | undefined,
  ) {}

  async run(): Promise<{
    ip: string[]
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  }> {
    let app = express()

    app.use(async (req: Request, res: Response) => {
      let 请求id = short().new()
      let log = (await this.log).extend(请求id).extend('控制器')

      try {
        let 请求路径 = req.path
        let 请求方法 = req.method.toLowerCase()

        await log.debug('收到请求, 路径: %o, 方法: %o', 请求路径, 请求方法)

        await log.debug('尝试匹配接口...')
        let 目标接口 =
          this.接口们.find((接口) => {
            let 接口方法 = 接口.获得方法() as 接口方法类型
            let 接口路径 = 接口.获得路径() as 接口路径类型
            return 请求方法 === 接口方法 && 请求路径 === 接口路径
          }) ?? null
        if (目标接口 !== null) {
          await log.debug('命中接口')

          let 接口逻辑 = 目标接口.获得逻辑() as 任意的接口逻辑
          let 接口返回 = 目标接口.获得结果转换器() as 任意的接口结果转换器

          await log.debug('调用接口逻辑...')
          let 接口结果 = await 接口逻辑.运行(req, res, {}, { 请求id })
          await log.debug('接口逻辑执行完毕')

          await log.debug('准备执行返回逻辑...')
          let 最终结果 = 接口返回.实现(接口结果) as unknown
          await log.debug('返回数据: %o', 递归截断字符串(最终结果))
          res.send(最终结果)
          await log.debug('返回逻辑执行完毕')

          return
        }

        await log.debug('没有命中接口')

        let 静态资源路径 = this.静态资源路径 ?? null
        if (静态资源路径 !== null && req.method.toLowerCase() === 'get') {
          await log.debug('尝试匹配静态资源...')
          express.static(静态资源路径, {
            setHeaders: async () => {
              await log.debug('命中静态资源')
            },
          })(req, res, async () => {
            await log.debug('没有命中静态资源')

            await log.debug('没有命中任何资源')
            res.status(404)
            res.end()
          })
        }
      } catch (e) {
        await log.err(e)
        res.status(500)
        res.send('服务器内部错误')
      }
    })

    // 创建 HTTP 服务器
    let server = app.listen(this.端口)

    // 创建 WebSocket 服务器并复用 HTTP 服务器
    let wss = new WebSocketServer({ server })
    wss.on('connection', async (ws: WebSocket, req) => {
      let log = (await this.log).extend(short().new()).extend('WebSocket')
      await log.debug(`WebSocket 请求连接: ${req.url}`)

      let WebSocket管理者 = await Global.getItem('WebSocket管理者')
      let 客户端id = req.url?.split('?id=')[1] ?? null

      if (客户端id === null) return ws.close(4001, '缺少客户端 ID')
      if ((await WebSocket管理者.查询连接存在(客户端id)) === true) return ws.close(4002, '客户端 ID 已存在')
      let 存在的客户端id = 客户端id

      await WebSocket管理者.增加连接(客户端id, ws)

      await log.debug(`WebSocket 连接已建立, 客户端id: ${客户端id}`)

      ws.on('close', async () => {
        await log.debug(`WebSocket 连接已关闭: ${客户端id}`)
        await WebSocket管理者.删除连接(存在的客户端id)
      })

      ws.on('error', async (err) => {
        await log.err(`WebSocket 出现错误 ${客户端id}: %o`, err)
        await WebSocket管理者.删除连接(存在的客户端id)
      })
    })

    return {
      ip: Object.values(networkInterfaces())
        .flat()
        .flatMap((address) => ((address ?? null) !== null ? [address] : []))
        .map((wrappedAddress) => wrappedAddress?.address)
        .map((address) => `http://${address}:${this.端口}`),
      server,
    }
  }
}
