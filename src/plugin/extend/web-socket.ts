import { z } from 'zod'
import { Global } from '../../global/global'
import { 包装插件项, 取Task插件类型, 插件, 插件项类型 } from '../plug'

export class WebSocket插件<信息 extends z.AnyZodObject | z.ZodUnion<any>> extends 插件<
  z.ZodObject<{
    ws操作: z.ZodUnion<
      [
        z.ZodObject<{
          发送ws信息: z.ZodFunction<z.ZodTuple<[信息], null>, z.ZodPromise<z.ZodVoid>>
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
  private log = Global.getItem('log')

  constructor(信息描述: 信息) {
    super(
      z.object({
        ws操作: z
          .object({
            发送ws信息: z.function(z.tuple([信息描述]), z.promise(z.void())),
            关闭ws连接: z.function(z.tuple([]), z.promise(z.void())),
            设置清理函数: z.function(z.tuple([z.function(z.tuple([]), z.promise(z.void()))]), z.promise(z.void())),
          })
          .or(z.null()),
      }),
      async (req, _res, 附加参数) => {
        let log = (await this.log).extend(附加参数.请求id).extend('webSocket插件')
        let WebSocket管理器 = await Global.getItem('WebSocket管理器')

        let wsId = req.headers['ws-client-id']
        await log.debug('检查 ws-client-id 头信息', { wsId })
        if (typeof wsId !== 'string') {
          await log.error('未能获取到有效的 WebSocket Id')
          return { ws操作: null }
        }
        let 存在的wsId = wsId
        await log.debug('已获得 WebSocket Id: %o', wsId)

        return {
          ws操作: {
            async 发送ws信息(信息: 信息): Promise<void> {
              await log.debug('发送 WebSocket 信息: %O', 信息)
              await WebSocket管理器.发送信息(存在的wsId, 信息)
            },
            async 关闭ws连接(): Promise<void> {
              await log.debug('关闭 WebSocket 连接')
              await WebSocket管理器.标记连接已完成(存在的wsId)
            },
            async 设置清理函数(清理函数): Promise<void> {
              await WebSocket管理器.设置清理函数(存在的wsId, 清理函数)
            },
          },
        }
      },
    )
  }
}

export type 任意WS插件 = WebSocket插件<any>
export type 任意WS插件项 = 包装插件项<任意WS插件>
export type 取WS插件泛型<A> = A extends WebSocket插件<infer x> ? x : never
export type 取第一个WS插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<插件项类型>
        ? 插件项 extends 任意WS插件项
          ? z.infer<取WS插件泛型<取Task插件类型<插件项>>>
          : 取第一个WS插件结果<xs>
        : {}
      : {}
    : {}
