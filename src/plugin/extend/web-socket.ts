import { WebSocket } from 'ws'
import { z } from 'zod'
import { Global } from '../../global/global'
import { 包装插件项, 取Task插件类型, 插件, 插件项类型 } from '../plug'

export class WebSocket插件<信息 extends z.AnyZodObject> extends 插件<
  z.ZodObject<{
    ws操作: z.ZodUnion<
      [
        z.ZodObject<{
          发送ws信息: z.ZodFunction<z.ZodTuple<[信息], null>, z.ZodPromise<z.ZodVoid>>
          关闭ws连接: z.ZodFunction<z.ZodTuple<[], null>, z.ZodPromise<z.ZodVoid>>
        }>,
        z.ZodUndefined,
      ]
    >
  }>
> {
  constructor(信息描述: 信息) {
    super(
      z.object({
        ws操作: z
          .object({
            发送ws信息: z.function(z.tuple([信息描述]), z.promise(z.void())),
            关闭ws连接: z.function(z.tuple([]), z.promise(z.void())),
          })
          .or(z.undefined()),
      }),
      async (req, _res) => {
        var wsId = req.headers['ws-client-id']
        var WebSocket管理者 = await Global.getItem('WebSocket管理者')
        var ws句柄: WebSocket | null = null
        if (typeof wsId == 'string') ws句柄 = await WebSocket管理者.获得句柄(wsId)
        if (!ws句柄) return { ws操作: undefined }
        var 存在的ws句柄 = ws句柄

        return {
          ws操作: {
            async 发送ws信息(信息: 信息): Promise<void> {
              存在的ws句柄.send(JSON.stringify(信息))
            },
            async 关闭ws连接(): Promise<void> {
              存在的ws句柄.close()
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
