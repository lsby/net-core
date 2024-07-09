import type * as http from 'node:http'
import { networkInterfaces } from 'node:os'
import type { Request, Response } from 'express'
import express from 'express'
import type { z } from 'zod'
import { seqArrayTask, Task } from '@lsby/ts-fp-data'
import { GlobalLog } from '../global/global'
import type { 任意接口 } from '../interface/interface'
import type { 插件 } from '../interface/plug'

export class 服务器 {
  private log = GlobalLog.getInstance()

  constructor(
    private 接口们: 任意接口[],
    private 端口: number,
  ) {}

  run(): Task<{
    ip: string[]
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
  }> {
    return new Task(async () => {
      var log = (await this.log.run()).extend('服务器')

      const app = express()

      app.use((req: Request, res: Response) => {
        new Task(async () => {
          const 请求路径 = req.path
          const 请求方法 = req.method.toLowerCase()

          log.debug('收到请求，路径：%o，方法：%o', 请求路径, 请求方法)

          const 目标接口 = this.接口们.find((接口) => {
            const 接口类型 = 接口.获得类型()
            return 请求路径 === 接口类型.获得路径() && 请求方法 === 接口类型.获得方法()
          })

          if (目标接口 === undefined) {
            throw new Error('无法找到对应接口')
          }

          const 接口类型 = 目标接口.获得类型()
          const 接口插件 = 接口类型.获得插件们() as Array<插件<z.AnyZodObject>>
          log.debug('找到 %o 个 插件，准备执行...', 接口插件.length)

          var 插件结果 = seqArrayTask(
            接口插件.map((插件) => {
              const 实现 = 插件.获得实现()
              return 实现(req, res)
            }),
          ).map((a) => a.reduce((s, a) => Object.assign(s, a), {}))
          log.debug('插件 执行完毕')

          const 接口实现 = 目标接口.获得实现()
          log.debug('准备执行接口逻辑...')
          const 接口结果 = 插件结果.bind(接口实现)
          log.debug('接口逻辑执行完毕')

          log.debug('准备执行返回逻辑...')
          ;(await 接口结果.run()).run(req, res)
          log.debug('返回逻辑执行完毕')
        })
          .tryRun()
          .then((a) => {
            if (a.isLeft()) {
              log.err(a.getLeft())
              res.send('未知错误')
            }
          })
          .catch(() => {})
      })

      let server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null = null
      if (server === null) {
        throw new Error('启动服务器失败')
      }

      await new Promise<void>((res, _rej) => {
        server = app.listen(this.端口, () => {
          res()
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
    })
  }
}
