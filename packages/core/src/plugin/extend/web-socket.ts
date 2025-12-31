import { WebSocket } from 'ws'
import { z } from 'zod'
import { Global } from '../../global/global'
import { 插件, 插件项类型 } from '../plug'

export class WebSocket插件<
  后推前信息 extends z.AnyZodObject | z.ZodUnion<any>,
  前推后信息 extends z.AnyZodObject | z.ZodUnion<any>,
> extends 插件<
  z.ZodObject<{
    ws操作: z.ZodUnion<
      [
        z.ZodObject<{
          发送ws信息: z.ZodFunction<z.ZodTuple<[后推前信息], null>, z.ZodPromise<z.ZodVoid>>
          监听ws信息: z.ZodFunction<
            z.ZodTuple<[z.ZodFunction<z.ZodTuple<[前推后信息], null>, z.ZodPromise<z.ZodVoid>>], null>,
            z.ZodPromise<z.ZodVoid>
          >
          关闭ws连接: z.ZodFunction<z.ZodTuple<[], null>, z.ZodPromise<z.ZodVoid>>
          设置清理函数: z.ZodFunction<
            z.ZodTuple<[z.ZodFunction<z.ZodTuple<[], null>, z.ZodPromise<z.ZodVoid>>], null>,
            z.ZodPromise<z.ZodVoid>
          >
        }>,
        z.ZodNull,
      ]
    >
  }>
> {
  public constructor(后推前信息描述: 后推前信息, 前推后信息描述: 前推后信息) {
    super(
      z.object({
        ws操作: z
          .object({
            发送ws信息: z.function(z.tuple([后推前信息描述]), z.promise(z.void())),
            监听ws信息: z.function(
              z.tuple([z.function(z.tuple([前推后信息描述]), z.promise(z.void()))]),
              z.promise(z.void()),
            ),
            关闭ws连接: z.function(z.tuple([]), z.promise(z.void())),
            设置清理函数: z.function(z.tuple([z.function(z.tuple([]), z.promise(z.void()))]), z.promise(z.void())),
          })
          .or(z.null()),
      }),
      async (req, _res, 附加参数) => {
        let log = 附加参数.log.extend('webSocket插件')
        let WebSocket管理器 = await Global.getItem('WebSocket管理器')
        let ws句柄: WebSocket | null = null

        let wsId = req.headers['ws-client-id']
        await log.debug('检查 ws-client-id 头信息', { wsId })
        if (typeof wsId !== 'string') {
          await log.error('未能获取到有效的 WebSocket Id')
          return { ws操作: null }
        }
        await log.debug('已获得 WebSocket Id: %o', wsId)

        return {
          ws操作: {
            async 发送ws信息(信息: 后推前信息): Promise<void> {
              if (ws句柄 === null) {
                ws句柄 = await WebSocket管理器.获得句柄(wsId)
              }

              if (ws句柄 === null) {
                await log.error('未能获取到有效的 WebSocket 句柄')
                return
              }

              if (ws句柄.readyState !== WebSocket.OPEN) {
                await log.warn('WebSocket 未打开，无法发送消息', { wsId })
                return
              }

              await new Promise<void>((resolve, reject) => {
                ws句柄?.send(JSON.stringify(信息), (err: Error | undefined | null) => {
                  if (err !== void 0 && err !== null) {
                    log
                      .warn('发送 WebSocket 信息失败', { 错误: err })
                      .catch((a) => `日志输出错误: ${a}: 日志内容: ${`发送 WebSocket 信息失败: ${err}`}`)
                    return reject(err)
                  }
                  resolve()
                })
              })
            },

            async 关闭ws连接(): Promise<void> {
              await log.debug('关闭 WebSocket 连接', { wsId })
              WebSocket管理器.删除连接(wsId)
            },

            async 设置清理函数(清理函数): Promise<void> {
              await log.debug('设置 WebSocket 清理函数', { wsId })
              await WebSocket管理器.设置清理函数(wsId, 清理函数)
            },

            async 监听ws信息(回调函数): Promise<void> {
              if (ws句柄 === null) {
                ws句柄 = await WebSocket管理器.获得句柄(wsId)
              }

              if (ws句柄 === null) {
                await log.error('未能获取到有效的 WebSocket 句柄')
                return
              }

              await log.debug('注册 WebSocket 消息监听', { wsId })
              await WebSocket管理器.设置消息监听(wsId, 回调函数)
            },
          },
        }
      },
    )
  }
}

export type 任意WS插件 = WebSocket插件<any, any>
export type 任意WS插件项 = 任意WS插件
export type 取WS插件泛型<A> = A extends WebSocket插件<infer x, infer y> ? [x, y] : never
export type 取第一个WS插件输出<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? 插件项 extends 任意WS插件项
          ? z.infer<取WS插件泛型<插件项>[0]>
          : 取第一个WS插件输出<xs>
        : {}
      : {}
    : {}
export type 取第一个WS插件输入<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? 插件项 extends 任意WS插件项
          ? z.infer<取WS插件泛型<插件项>[1]>
          : 取第一个WS插件输入<xs>
        : {}
      : {}
    : {}
