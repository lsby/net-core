import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import type { Request, Response } from 'express'
import express from 'express'
import short from 'short-uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { Global } from '../global/global'
import { 任意接口 } from '../interface/interface-inst'
import { 任意接口类型 } from '../interface/interface-type'
import { 插件项类型 } from '../plugin/plug'

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

        let 目标接口 = this.接口们.find((接口) => {
          let 接口类型 = 接口.获得接口类型() as 任意接口类型
          return 请求路径 == 接口类型.获得路径() && 请求方法 == 接口类型.获得方法()
        })
        if (目标接口 != null) {
          await log.debug('命中接口')

          let 接口类型 = 目标接口.获得接口类型() as 任意接口类型
          let 接口插件 = 接口类型.获得插件们() as Array<插件项类型>
          await log.debug('找到 %o 个 插件, 准备执行...', 接口插件.length)

          let 插件结果 = (
            await Promise.all(接口插件.map(async (插件) => await (await 插件.run()).运行(req, res, { 请求id })))
          ).reduce((s, a) => Object.assign(s, a), {})
          await log.debug('插件 执行完毕')

          await log.debug('准备执行接口逻辑...')
          let 接口结果 = await 目标接口.接口实现(插件结果)
          await log.debug('接口逻辑执行完毕')

          await log.debug('准备执行返回逻辑...')
          await 接口结果.run(req, res, { 请求id })
          await log.debug('返回逻辑执行完毕')

          return
        }
        await log.debug('没有命中接口')

        if (this.静态资源路径 && req.method.toLowerCase() == 'get') {
          await log.debug('尝试匹配静态资源...')
          express.static(this.静态资源路径, {
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
      let 客户端id = req.url?.split('?id=')[1]

      if (!客户端id) return ws.close(4001, '缺少客户端 ID')
      if ((await WebSocket管理者.查询连接存在(客户端id)) == true) return ws.close(4002, '客户端 ID 已存在')
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
        .flatMap((address) => (address !== undefined ? [address] : []))
        .map((wrappedAddress) => wrappedAddress.address)
        .map((address) => `http://${address}:${this.端口}`),
      server,
    }
  }
}
