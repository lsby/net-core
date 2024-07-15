import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import { GlobalLog } from '../global/global'
import { 任意接口 } from '../interface/interface'
import { 插件项类型 } from '../interface/plug'

export class 服务器 {
  private log = GlobalLog.getInstance()

  constructor(
    private 接口们: 任意接口[],
    private 端口: number,
    private 静态资源路径?: string | undefined,
  ) {}

  async run(): Promise<{
    ip: string[]
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  }> {
    var log = (await this.log).extend('服务器')

    const app = express()

    app.use(async (req: Request, _res: Response, next: NextFunction) => {
      const 请求路径 = req.path
      const 请求方法 = req.method.toLowerCase()

      await log.debug('收到请求, 路径: %o, 方法: %o', 请求路径, 请求方法)

      next()
    })
    app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        await log.debug('尝试匹配接口...')

        const 请求路径 = req.path
        const 请求方法 = req.method.toLowerCase()

        const 目标接口 = this.接口们.find((接口) => {
          const 接口类型 = 接口.获得类型()
          return 请求路径 == 接口类型.获得路径() && 请求方法 == 接口类型.获得方法()
        })

        if (目标接口 == undefined) {
          await log.debug('没有命中任何接口')
          next()
          return
        }

        const 接口类型 = 目标接口.获得类型()
        const 接口插件 = 接口类型.获得插件们() as Array<插件项类型>
        await log.debug('找到 %o 个 插件, 准备执行...', 接口插件.length)

        const 插件结果 = (
          await Promise.all(接口插件.map(async (插件) => await (await 插件.run()).获得实现()(req, res)))
        ).reduce((s, a) => Object.assign(s, a), {})
        await log.debug('插件 执行完毕')

        const 接口实现 = 目标接口.获得实现()
        await log.debug('准备执行接口逻辑...')
        const 接口结果 = await 接口实现(插件结果)
        await log.debug('接口逻辑执行完毕')

        await log.debug('准备执行返回逻辑...')
        await 接口结果.run(req, res)
        await log.debug('返回逻辑执行完毕')
      } catch (e) {
        await log.err(e)
        res.status(500)
        res.send('服务器内部错误')
      }
    })
    if (this.静态资源路径) {
      var 静态资源路径 = this.静态资源路径
      app.use(async (req, res, next) => {
        const 请求方法 = req.method.toLowerCase()
        if (请求方法 == 'get') return next()
        await log.debug('尝试查找静态资源...')
        return express.static(静态资源路径)(req, res, next)
      })
    }
    app.use(async (req, res) => {
      await log.debug('没有命中任何资源...')
      res.status(404)
    })

    var server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null = null
    await new Promise<void>((res, _rej) => {
      server = app.listen(this.端口, () => res())
    })
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (server == null) throw new Error('启动服务器失败')

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
