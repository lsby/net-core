import { Right } from '@lsby/ts-fp-data'
import { WebSocket } from 'ws'
import { z } from 'zod'
import { 集线器监听器宿主 } from '../global/model/hub'
import { 任意插件, 插件 } from '../interface/interface-plugin'

let 错误类型描述 = z.never()

export class WebSocket插件<
  后推前信息 extends z.AnyZodObject | z.ZodNever | z.ZodUnion<any>,
  前推后信息 extends z.AnyZodObject | z.ZodNever | z.ZodUnion<any>,
> extends 插件<
  typeof 错误类型描述,
  z.ZodObject<{
    ws操作: z.ZodUnion<
      [
        z.ZodObject<{
          发送ws信息: z.ZodFunction<z.ZodTuple<[后推前信息], null>, z.ZodPromise<z.ZodVoid>>
          监听ws信息: z.ZodFunction<
            z.ZodTuple<
              [z.ZodFunction<z.ZodTuple<[前推后信息], null>, z.ZodPromise<z.ZodVoid>>, z.ZodType<集线器监听器宿主>],
              null
            >,
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
  public constructor(后推前信息描述: 后推前信息, 前推后信息描述: 前推后信息, wsKey: string = 'ws-client-id') {
    super(
      错误类型描述,
      z.object({
        ws操作: z
          .object({
            发送ws信息: z.function(z.tuple([后推前信息描述]), z.promise(z.void())),
            监听ws信息: z.function(
              z.tuple([z.function(z.tuple([前推后信息描述]), z.promise(z.void())), z.instanceof(集线器监听器宿主)]),
              z.promise(z.void()),
            ),
            关闭ws连接: z.function(z.tuple([]), z.promise(z.void())),
            设置清理函数: z.function(z.tuple([z.function(z.tuple([]), z.promise(z.void()))]), z.promise(z.void())),
          })
          .or(z.null()),
      }),
      async (req, _res, 附加参数) => {
        let log = 附加参数.log.extend(WebSocket插件.name)

        let WebSocket管理器 = 附加参数.webSocket管理器
        let ws句柄: WebSocket | null = null

        let wsId = req.headers[wsKey]
        await log.debug('检查头信息', { wsId })
        if (typeof wsId !== 'string') {
          await log.error('未能获取到有效的 WebSocket Id')
          return new Right({ ws操作: null })
        }
        await log.debug('已获得 WebSocket Id: %o', wsId)

        return new Right({
          ws操作: {
            async 发送ws信息(信息: 后推前信息): Promise<void> {
              if (ws句柄 === null) {
                ws句柄 = await WebSocket管理器.获得ws句柄(wsId)
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

            async 监听ws信息(回调函数, 宿主): Promise<void> {
              if (ws句柄 === null) {
                ws句柄 = await WebSocket管理器.获得ws句柄(wsId)
              }

              if (ws句柄 === null) {
                await log.error('未能获取到有效的 WebSocket 句柄')
                return
              }

              // -------------------------------------------------------------
              // ⚠️ 垃圾回收(GC)对抗机制 (黑魔法)
              // 
              // 在集线器模型中, 监听器的生命周期依赖于 `宿主` 对象的存活, 内部通过 WeakRef 和 FinalizationRegistry 实现.
              // 由于 V8 引擎进行 GC 依据的是"可达性分析"(Reachability Analysis)而不是块级作用域:
              // 如果业务逻辑在调用本方法后, 后续代码里再也没有引用过该 `宿主` 变量(即使用户认为还没跳出函数块),
              // 这个变量很可能在代码遇到 await 异步挂起时就被 V8 判定为"死亡"并意外早收, 进而导致合法的监听器莫名其妙离线.
              // 
              // 为了避免上述现象, 我们将传入的 `宿主` 手动挂载到此原生 WebSocket 句柄对象的自定义属性 `__hosts` 里面.
              // 让其强引用随着 WS 持久化, 只要 WebSocket 连接没有断开, `宿主` 就绝对不会被回收, 实现同生共死.
              // 同时, 通过拦截 `解绑` 函数, 在用户显式调用时同步剔除该强引用绑定, 以免存在无伤大雅的泄漏.
              // -------------------------------------------------------------
              let 私有属性句柄 = ws句柄 as WebSocket & { __hosts?: Set<集线器监听器宿主> }
              let 关联宿主集合: Set<集线器监听器宿主> | undefined = 私有属性句柄.__hosts
              if (关联宿主集合 === void 0) {
                关联宿主集合 = new Set<集线器监听器宿主>()
                私有属性句柄.__hosts = 关联宿主集合
              }
              关联宿主集合.add(宿主)

              let 原始解绑: () => void = 宿主.解绑.bind(宿主)
              宿主.解绑 = (): void => {
                原始解绑()
                关联宿主集合.delete(宿主)
              }

              await log.debug('注册 WebSocket 消息监听', { wsId })
              WebSocket管理器.设置消息监听(wsId, 回调函数, 宿主)
            },
          },
        })
      },
    )
  }
}

export type 任意WS插件 = WebSocket插件<any, any>
export type 任意WS插件项 = 任意WS插件
export type 取WS插件泛型<A> = A extends WebSocket插件<infer x, infer y> ? [x, y] : never
export type 取第一个WS插件输出<Arr extends Array<任意插件>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<任意插件>
        ? 插件项 extends 任意WS插件项
          ? z.infer<取WS插件泛型<插件项>[0]>
          : 取第一个WS插件输出<xs>
        : {}
      : {}
    : {}
export type 取第一个WS插件输入<Arr extends Array<任意插件>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件项
      ? xs extends Array<任意插件>
        ? 插件项 extends 任意WS插件项
          ? z.infer<取WS插件泛型<插件项>[1]>
          : 取第一个WS插件输入<xs>
        : {}
      : {}
    : {}
