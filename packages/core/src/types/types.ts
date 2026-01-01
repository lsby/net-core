export type 空对象 = Record<PropertyKey, never>
export type 兼容空对象 = Record<PropertyKey, unknown>

export type 非空基本类型 = string | number | boolean
export type 基本类型 = 非空基本类型 | null
export type 递归基本类型 = 基本类型 | { [k: PropertyKey]: 递归基本类型 } | Array<递归基本类型>
export type 可序列化类型 = 基本类型 | { [k: string]: 可序列化类型 } | Array<可序列化类型>
