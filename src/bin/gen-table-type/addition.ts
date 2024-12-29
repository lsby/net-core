export let 附加代码 = `
export type 基本类型 = string | number | boolean | null
export type 条件<列名称们> =
  | { 列名称: 列名称们; 符号: '=' | '<>'; 值: 基本类型 }
  | { 列名称: 列名称们; 符号: '>' | '<' | '>=' | '<='; 值: number | string }
  | { 列名称: 列名称们; 符号: 'like' | 'not like'; 值: string }
  | { 列名称: 列名称们; 符号: 'in' | 'not in'; 值: 基本类型[] }
  | { 列名称: 列名称们; 符号: 'is' | 'is not'; 值: 基本类型 }
export type 条件组<列名称们> =
  | { 模式: '直接条件'; 值: 条件<列名称们> }
  | { 模式: '组合条件'; 组合模式: '与' | '或'; 条件们: 条件<列名称们>[] }
export type 扁平化条件组项<列名称们> = { 组合模式: '与' | '或'; 条件: 条件<列名称们> }
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
export type 翻译列描述<对象> = { [key in keyof 对象]: 翻译自定义类型<对象[key]> }
`
