export let 附加代码 = `
export type 是any<T> = 0 extends 1 & T ? true : false
export type 条件<列定义> =
  是any<列定义> extends true
    ? any
    :
        | { [K in keyof 列定义]: { 列: K; 符号: '=' | '<>'; 值: 列定义[K][] } }[keyof 列定义]
        | { [K in keyof 列定义]: { 列: K; 符号: 'in' | 'not in'; 值: null } }[keyof 列定义]
        | { [K in keyof 列定义]: { 列: K; 符号: 'is' | 'is not'; 值: null } }[keyof 列定义]
        | {
            [K in keyof 列定义]: 列定义[K] extends string ? { 列: K; 符号: 'like' | 'not like'; 值: string } : never
          }[keyof 列定义]
        | {
            [K in keyof 列定义]: 列定义[K] extends number ? { 列: K; 符号: '>' | '<' | '>=' | '<='; 值: number } : never
          }[keyof 列定义]
export type 条件组<列定义 extends object> = 条件<列定义>[]
export type 分页选项 = {
  页数: number
  大小: number
}
export type 排序选项<列名称们> = {
  排序列: 列名称们
  排序模式: '正序' | '倒序'
}
export type 翻译自定义类型<A> = A extends '字符串'
  ? string
  : A extends '数字'
    ? number
    : A extends '布尔'
      ? boolean
      : never
export type 翻译列描述<对象> = 是any<对象> extends true ? any : { [key in keyof 对象]: 翻译自定义类型<对象[key]> }
export type 翻译列描述带空<对象> =
  是any<对象> extends true ? any : { [key in keyof 对象]: 翻译自定义类型<对象[key]> | undefined }
`
