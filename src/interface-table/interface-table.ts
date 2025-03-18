import { z } from 'zod'
import { 接口逻辑 } from '../interface-api/interface-logic'
import { 插件项类型 } from '../plugin/plug'

// 修改这些定义的时候 计算类型的bin也需要改
export type 是any<T> = 0 extends 1 & T ? true : false
export type 条件<列定义> =
  是any<列定义> extends true
    ? any
    :
        | { [K in keyof 列定义]: { 列: K; 符号: '=' | '<>'; 值: 列定义[K] } }[keyof 列定义]
        | { [K in keyof 列定义]: { 列: K; 符号: 'in' | 'not in'; 值: 列定义[K][] } }[keyof 列定义]
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
export type 翻译列描述<对象> =
  是any<对象> extends true
    ? any
    : { [key in keyof 对象]: '类型' extends keyof 对象[key] ? 翻译自定义类型<对象[key]['类型']> : never }

// 可空: 允许为null
// 可选: 插入时可以不提供, 有默认值
export type 翻译查询列描述<对象> =
  是any<对象> extends true
    ? any
    : {
        [key in keyof 对象]: '类型' extends keyof 对象[key]
          ? '可空' extends keyof 对象[key]
            ? 对象[key]['可空'] extends 'false'
              ? 翻译自定义类型<对象[key]['类型']>
              : 翻译自定义类型<对象[key]['类型']> | null
            : never
          : never
      }
export type 翻译插入列描述<对象> =
  是any<对象> extends true
    ? any
    : 归约数组对象<
        联合转元组<
          未定义对象转可选对象<{
            [key in keyof 对象]: '类型' extends keyof 对象[key]
              ? '可选' extends keyof 对象[key]
                ? 对象[key]['可选'] extends 'false'
                  ? 翻译自定义类型<对象[key]['类型']>
                  : 翻译自定义类型<对象[key]['类型']> | undefined
                : never
              : never
          }>
        >
      >
export type 翻译修改值列描述<对象> =
  是any<对象> extends true
    ? any
    : 归约数组对象<
        联合转元组<
          未定义对象转可选对象<{
            [key in keyof 对象]: '类型' extends keyof 对象[key]
              ? '可空' extends keyof 对象[key]
                ? 对象[key]['可空'] extends 'false'
                  ? 翻译自定义类型<对象[key]['类型']>
                  : 翻译自定义类型<对象[key]['类型']> | null
                : never
              : never
          }>
        >
      >
export type 未定义对象转可选对象<X> = {
  [key in keyof X]: undefined extends X[key] ? { [k in key]?: X[key] } : { [k in key]: X[key] }
}[keyof X]

type 归约数组对象<Arr> = Arr extends [] ? {} : Arr extends [infer x, ...infer xs] ? x & 归约数组对象<xs> : never

type 联合转换成函数<X> = X extends any ? (a: (x: any) => X) => any : never
type 函数转换成与<X> = (X extends any ? X : never) extends (a: infer A) => any ? A : never
type 取最后一个<X> = 函数转换成与<联合转换成函数<X>> extends (x: any) => infer A ? A : never
type 联合转元组<X> = [X] extends [never]
  ? []
  : 取最后一个<X> extends infer Last
    ? [...联合转元组<Exclude<X, Last>>, Last]
    : never

/**
 * # 虚拟表
 *
 * 注意到后端大部分时候只做两件事:
 * - 查询数据库的数据给前端
 * - 接收前端数据, 以此更新或修改数据库的数据
 * 甚至可以说, 后端就是提供了带鉴权的有限数据库操作机制.
 *
 * 同时, 注意到前端请求和修改数据是基于结构的.
 * 例如: 前端不会要求"修改学生表的第十行的第三列的值", 而是"修改学生id为x的姓名"
 * 注意: 前端理解的这种结构, 并不是数据库本身的结构, 而是将数据库的数据进行重组后得到的, 这个转换的过程通常由后端完成.
 *
 * 这样, 我们就得到了一个统一的心智模型: 后端就是对数据库结构进行重组映射, 得到前端期望的虚拟表, 同时提供模型的增删改查操作, 的逻辑集合.
 *
 * 我们可以抽象这个过程.
 * 写一个"虚拟表"的抽象类.
 * 构造这个类时需要提供构造参数, 构造参数将模型映射为一个确定的sql语句或一个构造式.
 * 这个语句的结果必然是一个表, 这个表的行不确定, 但列是固定的.
 * 这个表并不一定对应数据库里的某张表, 而是依据前端视角, 构造出来的逻辑表.
 * 这个表的实际数据可能映射到数据库的一张或多张表上, 也可能映射到内存或其他位置上.
 *
 * 既然列已固定, 增删改查的参数和返回值就都可以确定.
 * 当然, 并不是任何模型都可以同时提供增删改查, 如果不能提供或者不想提供, 直接报错即可.
 *
 * 接下来只需要继承这个类, 实现各种虚拟表即可, 注意到这些虚拟表是横向的, 可以很容易的扩展.
 * 这样, 编写后端的过程就是编写这些虚拟表的过程, 这些模型不但简单, 也很容易扩展和管理.
 * 我们可以很容易的编写大量的虚拟表来适配各种需求, 也很容易通过继承或组合产生新的虚拟表.
 *
 * 这样, 我们就将原来一个一个离散的过程式接口, 改成了对象式的虚拟表.
 */
export abstract class 虚拟表<
  构造参数类型 extends z.AnyZodObject,
  列形状 extends z.ZodObject<
    Record<
      string,
      z.ZodObject<{
        类型: z.ZodLiteral<'字符串'> | z.ZodLiteral<'数字'> | z.ZodLiteral<'布尔'>
        可选: z.ZodLiteral<'true'> | z.ZodLiteral<'false'>
        可空: z.ZodLiteral<'true'> | z.ZodLiteral<'false'>
      }>
    >
  >,
  增错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
  删错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
  改错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
  查错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
> {
  static 资源路径: string

  protected declare readonly __类型保持符号?: [构造参数类型, 列形状, 增错误, 删错误, 改错误, 查错误]

  constructor(protected 构造参数: z.infer<构造参数类型>) {}

  abstract 增(
    数据们: 翻译插入列描述<z.infer<列形状>>[],
  ): Promise<接口逻辑<插件项类型[], { data: { insertId: string }[] }, z.infer<增错误>, {}>>
  abstract 删(筛选条件: 条件组<翻译列描述<z.infer<列形状>>>): Promise<接口逻辑<插件项类型[], {}, z.infer<删错误>, {}>>
  abstract 改(
    新值: Partial<翻译修改值列描述<z.infer<列形状>>>,
    筛选条件: 条件组<翻译列描述<z.infer<列形状>>>,
  ): Promise<接口逻辑<插件项类型[], {}, z.infer<改错误>, {}>>
  abstract 查(
    筛选条件?: 条件组<翻译列描述<z.infer<列形状>>>,
    分页条件?: 分页选项,
    排序条件?: 排序选项<keyof z.infer<列形状>>,
  ): Promise<接口逻辑<插件项类型[], {}, z.infer<查错误>, 翻译查询列描述<z.infer<列形状>>[]>>

  调用增(body: {
    value: 翻译插入列描述<z.infer<列形状>>[]
  }): Promise<接口逻辑<插件项类型[], { data: { insertId: string }[] }, z.infer<增错误>, {}>> {
    return this.增(body.value)
  }
  调用删(body: {
    where: 条件组<翻译列描述<z.infer<列形状>>>
  }): Promise<接口逻辑<插件项类型[], {}, z.infer<删错误>, {}>> {
    return this.删(body.where)
  }
  调用改(body: {
    value: Partial<翻译修改值列描述<z.infer<列形状>>>
    where: 条件组<翻译列描述<z.infer<列形状>>>
  }): Promise<接口逻辑<插件项类型[], {}, z.infer<改错误>, {}>> {
    return this.改(body.value, body.where)
  }
  调用查(body: {
    where?: 条件组<翻译列描述<z.infer<列形状>>>
    page?: 分页选项
    sort?: 排序选项<keyof z.infer<列形状>>
  }): Promise<接口逻辑<插件项类型[], {}, z.infer<查错误>, 翻译查询列描述<z.infer<列形状>>[]>> {
    return this.查(body.where, body.page, body.sort)
  }
}
export type 任意虚拟表 = 虚拟表<any, any, any, any, any, any>
