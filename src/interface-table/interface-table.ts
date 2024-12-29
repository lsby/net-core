import { z } from 'zod'
import { 接口逻辑 } from '../interface-api/interface-logic'
import { 插件项类型 } from '../plugin/plug'

// 修改这些定义的时候 计算类型的bin也需要改
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
  列类型 extends z.ZodObject<Record<string, z.ZodLiteral<'字符串'> | z.ZodLiteral<'数字'> | z.ZodLiteral<'布尔'>>>,
  增错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
  删错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
  改错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
  查错误 extends z.ZodEnum<[string, ...string[]]> | z.ZodNever,
> {
  static 资源路径: string

  protected declare readonly __类型保持符号?: [构造参数类型, 列类型, 增错误, 删错误, 改错误, 查错误]

  constructor(protected 构造参数: z.infer<构造参数类型>) {}

  abstract 增(数据们: Partial<z.infer<列类型>>[]): Promise<接口逻辑<插件项类型[], {}, z.infer<增错误>, {}>>
  abstract 删(筛选条件: 条件组<keyof z.infer<列类型>>): Promise<接口逻辑<插件项类型[], {}, z.infer<删错误>, {}>>
  abstract 改(
    新值: Partial<z.infer<列类型>>,
    筛选条件: 条件组<keyof z.infer<列类型>>,
  ): Promise<接口逻辑<插件项类型[], {}, z.infer<改错误>, {}>>
  abstract 查(
    筛选条件?: 条件组<keyof z.infer<列类型>>,
    分页条件?: 分页选项,
    排序条件?: 排序选项<keyof z.infer<列类型>>,
  ): Promise<接口逻辑<插件项类型[], {}, z.infer<查错误>, 翻译列描述<z.infer<列类型>>[]>>
}
export type 任意虚拟表 = 虚拟表<any, any, any, any, any, any>

export function 扁平化条件组<列名称们>(条件组: 条件组<列名称们>[]): 扁平化条件组项<列名称们>[] {
  let 扁平化条件: 扁平化条件组项<列名称们>[] = []

  for (let 条件组项 of 条件组) {
    switch (条件组项.模式) {
      case '直接条件':
        扁平化条件.push({
          组合模式: '与',
          条件: 条件组项.值,
        })
        break
      case '组合条件':
        for (let 条件项 of 条件组项.条件们) {
          扁平化条件.push({
            组合模式: 条件组项.组合模式,
            条件: 条件项,
          })
        }
        break
    }
  }

  return 扁平化条件
}
