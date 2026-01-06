import { InterfaceType } from '../../types/interface-type'
import { parseURL } from './tools'

type 找接口<
  P extends string,
  method extends 'get' | 'post',
  T extends readonly any[] = InterfaceType,
> = T extends readonly [infer F, ...infer Rest]
  ? F extends { path: P; method: method }
    ? F
    : 找接口<P, method, Rest>
  : never
type 取http输入<I> = I extends { input: infer 输入 } ? 输入 : never
type 取http输出<I> = I extends { successOutput: infer 输出 } ? 输出 : never
type 取ws输出<I> = I extends { wsOutput: infer 输出 } ? 输出 : never
type 取ws输入<I> = I extends { wsInput: infer 输入 } ? 输入 : never
type 所有路径 = InterfaceType[number]['path']

export class API管理器 {
  private 生成id(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (字符): string => {
      let 随机数 = (Math.random() * 16) | 0
      let 值 = 字符 === 'x' ? 随机数 : (随机数 & 0x3) | 0x8
      return 值.toString(16)
    })
  }

  public async post请求<P extends 所有路径>(
    路径: P,
    数据: 取http输入<找接口<P, 'post'>>,
    ws选项?: {
      连接回调?: (发送消息: (数据: 取ws输入<找接口<P, 'post'>>) => void, ws句柄: WebSocket) => Promise<void>
      信息回调?: (数据: 取ws输出<找接口<P, 'post'>>) => Promise<void>
      关闭回调?: (事件: CloseEvent) => Promise<void>
      错误回调?: (事件: Event) => Promise<void>
    },
  ): Promise<取http输出<找接口<P, 'post'>>> {
    try {
      let wsid = this.生成id()
      let 请求头: Record<string, string> = { 'Content-Type': 'application/json' }

      if (ws选项 !== void 0) {
        let url解析 = parseURL(路径)
        if (url解析 === null) throw new Error(`无法解析url: ${路径}`)

        // 1. 先建立WebSocket连接
        let ws句柄 = new WebSocket(`${url解析.protocol}//${url解析.host}/ws?id=${wsid}`)
        请求头['ws-client-id'] = wsid

        let 连接回调函数 = ws选项.连接回调
        let 输出回调函数 = ws选项.信息回调
        let 关闭回调函数 = ws选项.关闭回调
        let 错误回调函数 = ws选项.错误回调

        // 2. 等待WebSocket连接建立完成
        await new Promise<void>((res, rej): void => {
          ws句柄.onopen = async (): Promise<void> => {
            let 发送消息 = (数据: 取ws输入<找接口<P, 'post'>>): void => {
              ws句柄.send(JSON.stringify(数据))
            }
            await 连接回调函数?.(发送消息, ws句柄)
            res()
          }
          ws句柄.onmessage = async (事件): Promise<void> => {
            try {
              let 数据 = JSON.parse(事件.data) as 取ws输出<找接口<P, 'post'>>
              await 输出回调函数?.(数据)
            } catch (错误) {
              console.error(错误)
            }
          }
          ws句柄.onclose = async (关闭事件): Promise<void> => {
            await 关闭回调函数?.(关闭事件)
          }
          ws句柄.onerror = async (错误事件): Promise<void> => {
            await 错误回调函数?.(错误事件)
            rej(new Error('WebSocket连接错误'))
          }
        })
      }

      // 3. WebSocket连接建立后，再发送HTTP请求
      let 响应 = await fetch(路径, { method: 'POST', headers: 请求头, body: JSON.stringify(数据) })

      return (await 响应.json()) as 取http输出<找接口<P, 'post'>>
    } catch (错误) {
      throw new Error(`请求失败: ${错误 instanceof Error ? 错误.message : String(错误)}`)
    }
  }
}
