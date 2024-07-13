import { z } from 'zod'
import { 接口 } from '../interface/interface'
import { 接口类型 } from '../interface/interface-type'
import { JSON解析插件 } from '../plugin/json'
import { 插件 } from './plug'

export type 任意接口 = 接口<any, any, any, any, any>
export type 任意接口类型 = 接口类型<any, any, any, any, any>

export type 插件项类型 = 插件<z.AnyZodObject>
export type 取插件内部类型<A> = A extends 插件<infer x> ? x : never

export type 任意插件 = 插件<any>
export type 任意JSON解析插件 = JSON解析插件<any>

export type 合并插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件
      ? xs extends Array<插件项类型>
        ? z.infer<取插件内部类型<插件>> & 合并插件结果<xs>
        : {}
      : {}
    : {}

export type 合并JSON插件结果<Arr extends Array<插件项类型>> = Arr extends []
  ? {}
  : Arr extends [infer x, ...infer xs]
    ? x extends infer 插件
      ? xs extends Array<插件项类型>
        ? 插件 extends 任意JSON解析插件
          ? z.infer<取插件内部类型<插件>>['body'] & 合并插件结果<xs>
          : {}
        : {}
      : {}
    : {}

export type 获得接口插件们<接口类型描述> = 接口类型描述 extends 接口类型<any, any, infer 插件, any, any> ? 插件 : never
export type 从接口类型获得JSON参数<接口类型描述> = 合并JSON插件结果<获得接口插件们<接口类型描述>>
