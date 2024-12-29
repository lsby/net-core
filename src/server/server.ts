import { Log } from '@lsby/ts-log'
import type { Request, Response } from 'express'
import express from 'express'
import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import short from 'short-uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { Global } from '../global/global'
import { 任意接口 } from '../interface-api/interface-base'
import { 任意接口逻辑 } from '../interface-api/interface-logic'
import { 任意接口结果转换器, 常用形式转换器 } from '../interface-api/interface-result'
import { 任意虚拟表 } from '../interface-table/interface-table'
import { 递归截断字符串 } from '../tools/tools'

type 虚拟表操作类型 = 'add' | 'del' | 'set' | 'get'

export class 服务器 {
  private log = Global.getItem('log')

  constructor(
    private 接口们: 任意接口[],
    private 虚拟表们: { new (构造参数: any): 任意虚拟表; 资源路径: string }[],
    private 端口: number,
    private 静态资源路径?: string,
  ) {}

  async run(): Promise<{
    ip: string[]
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  }> {
    let app = express()

    app.use(this.处理请求.bind(this))
    let server = app.listen(this.端口)
    await this.初始化WebSocket(server)

    return { ip: this.获取本地地址(), server }
  }

  private async 处理请求(req: Request, res: Response): Promise<void> {
    let 请求id = short().new()
    let log = (await this.log).extend(请求id).extend('控制器')

    try {
      let { path: 请求路径, method } = req
      let 请求方法 = method.toLowerCase()

      await log.debug('收到请求, 路径: %o, 方法: %o', 请求路径, 请求方法)

      // 静态资源处理
      let 静态资源路径 = this.静态资源路径 ?? null
      if (静态资源路径 !== null && 请求方法 === 'get' && (await this.处理静态资源(req, res, log))) {
        return
      }

      // 匹配接口
      let 目标接口 = this.接口们.find((接口) => 请求方法 === 接口.获得方法() && 请求路径 === 接口.获得路径()) ?? null
      if (目标接口 !== null) {
        await this.处理接口逻辑(req, res, log, 目标接口, 请求id)
        return
      }

      // 匹配虚拟表
      if (请求方法 === 'post') {
        let 目标虚拟表 = this.虚拟表们.find((虚拟表) => 请求路径.startsWith(虚拟表.资源路径)) ?? null
        if (目标虚拟表 !== null) {
          let 虚拟表操作 = this.解析虚拟表操作(目标虚拟表.资源路径, 请求路径)
          if (虚拟表操作 !== null) {
            await this.处理虚拟表逻辑(req, res, log, 虚拟表操作, 目标虚拟表, 请求id)
            return
          }
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
    await log.debug('返回数据: %o', 递归截断字符串(最终结果))

    res.send(最终结果)
    await log.debug('返回逻辑执行完毕')
  }

  private async 处理虚拟表逻辑(
    req: Request,
    res: Response,
    log: Log,
    虚拟表操作: 虚拟表操作类型,
    目标虚拟表: { new (构造参数: any): 任意虚拟表 },
    请求id: string,
  ): Promise<void> {
    await log.debug('调用虚拟表逻辑...')

    await log.debug('调用json解析...')
    await new Promise((pRes, _rej) =>
      express.json({})(req, res, () => {
        pRes(null)
      }),
    )
    await log.debug('json解析完成')

    await log.debug('虚拟表: %O', 目标虚拟表.name)
    await log.debug('操作: %O', 虚拟表操作)

    await log.debug('提取构造参数...')
    let 构造参数 = (req.body?.['construction'] ?? null) as unknown
    if (构造参数 === null) throw new Error('构造参数不能为空')
    await log.debug('构造参数: %O', 构造参数)

    let 虚拟表实例 = new 目标虚拟表(构造参数)
    let 结果: 任意接口逻辑
    switch (虚拟表操作) {
      case 'add': {
        await log.debug('调用逻辑: 增')
        结果 = await 虚拟表实例.增(req.body?.['value'])
        await log.debug('调用结束')
        break
      }
      case 'del': {
        await log.debug('调用逻辑: 删')
        结果 = await 虚拟表实例.删(req.body?.['where'])
        await log.debug('调用结束')
        break
      }
      case 'set': {
        await log.debug('调用逻辑: 改')
        结果 = await 虚拟表实例.改(req.body?.['value'], req.body?.['where'])
        await log.debug('调用结束')
        break
      }
      case 'get': {
        await log.debug('调用逻辑: 查')
        结果 = await 虚拟表实例.查(req.body?.['where'], req.body?.['page'], req.body?.['sort'])
        await log.debug('调用结束')
        break
      }
      default: {
        throw new Error(`意外的操作: ${虚拟表操作}`)
      }
    }

    let 最终结果 = new 常用形式转换器().实现(await 结果.运行(req, res, {}, { 请求id: 请求id }))
    await log.debug('返回数据: %o', 递归截断字符串(最终结果))

    res.send(最终结果)
    await log.debug('返回逻辑执行完毕')
  }

  private 解析虚拟表操作(资源路径: string, 请求路径: string): 虚拟表操作类型 | null {
    let 分解 = 请求路径.split('/')
    let 操作 = 分解.at(-1) ?? null
    let 解析资源路径 = 分解.slice(0, -1).join('/')
    if (解析资源路径 !== 资源路径) return null
    if (操作 !== 'add' && 操作 !== 'del' && 操作 !== 'set' && 操作 !== 'get') return null
    return 操作
  }

  private async 初始化WebSocket(server: http.Server): Promise<void> {
    let wss = new WebSocketServer({ server })
    let logBase = (await this.log).extend('web-socket')

    wss.on('connection', async (ws: WebSocket, req) => {
      let log = logBase.extend(short().new()).extend('WebSocket')
      await log.debug('收到 WebSocket 连接请求: %o', req.url)

      let 客户端id = req.url?.split('?id=')[1] ?? null

      if (客户端id === null) {
        await log.error('连接请求缺少客户端 ID')
        return this.关闭WebSocket连接(ws, log, 4001, '缺少客户端 ID')
      }

      await log.debug('解析客户端 ID: %s', 客户端id)

      let WebSocket管理者 = await Global.getItem('WebSocket管理者')
      let 是否已存在 = await WebSocket管理者.查询连接存在(客户端id)

      if (是否已存在) {
        await log.error('客户端 ID 已存在: %s', 客户端id)
        return this.关闭WebSocket连接(ws, log, 4002, '客户端 ID 已存在')
      }

      await WebSocket管理者.增加连接(客户端id, ws)
      await log.info('WebSocket 连接已建立, 客户端 ID: %s', 客户端id)

      ws.on('close', async () => {
        await log.info('WebSocket 连接关闭: %s', 客户端id)
        await WebSocket管理者.删除连接(客户端id)
      })

      ws.on('error', async (err) => {
        await log.error('WebSocket 出现错误, 客户端 ID: %s, 错误: %o', 客户端id, err)
        await WebSocket管理者.删除连接(客户端id)
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
    await log.debug(`关闭 WebSocket 连接, 原因: ${reason}`)
    ws.close(code, reason)
  }

  private 获取本地地址(): string[] {
    return Object.values(networkInterfaces())
      .flatMap((iface) => iface ?? [])
      .map((address) => `http://${address.address}:${this.端口}`)
  }
}
