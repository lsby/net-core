import { Log } from '@lsby/ts-log'
import { WebSocket管理器 } from '../global/model/web-socket'

export type 空对象 = Record<PropertyKey, never>
export type 兼容空对象 = Record<PropertyKey, unknown>

export type 非空基本类型 = string | number | boolean
export type 基本类型 = 非空基本类型 | null
export type 递归基本类型 = 基本类型 | { [k: PropertyKey]: 递归基本类型 } | Array<递归基本类型>
export type 可序列化类型 = 基本类型 | { [k: string]: 可序列化类型 } | Array<可序列化类型>

export type 请求附加参数类型 = { log: Log; 请求id: string; webSocket管理器: WebSocket管理器 }
