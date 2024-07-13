import { z } from 'zod'
import { 插件 } from './plug'

export type 插件项类型 = 插件<z.AnyZodObject>
export type 取插件内部类型<A> = A extends 插件<infer x> ? x : never
