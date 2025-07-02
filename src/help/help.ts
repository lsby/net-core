export function 构造元组<T extends any[]>(args: [...T]): T {
  return args
}
// export function 构造对象<K extends string, V>(key: K, value: V): { [P in K]: V } {
//   return { [key]: value } as any
// }
export function 构造对象<K extends string, V>(key: K, value: V): Record<K, V> {
  return { [key]: value } as any
}

export type 去除只读<T> = T extends readonly [...infer U] ? U : never
export type 类型相等<A, B> = A extends B ? (B extends A ? true : false) : false

export function 截断字符串(内容: string): string {
  let 最大日志长度 = 1000

  if (内容.length > 最大日志长度) return 内容.slice(0, 最大日志长度) + '...'
  return 内容
}

export function 递归截断字符串(数据: any): any {
  if (typeof 数据 === 'string') return 截断字符串(数据)
  if (Array.isArray(数据)) return 数据.map((项) => 递归截断字符串(项))
  if (typeof 数据 === 'object' && 数据 !== null) {
    let 新数据: Record<string, any> = {}
    for (let key in 数据) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (数据.hasOwnProperty(key) === true) 新数据[key] = 递归截断字符串(数据[key])
    }
    return 新数据
  }
  return 数据
}

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer U) => any ? U : never
type LastUnion<T> = UnionToIntersection<T extends any ? (x: T) => any : never> extends (x: infer L) => any ? L : never
export type 联合转元组<T, Last = LastUnion<T>> = [T] extends [never] ? [] : [...联合转元组<Exclude<T, Last>>, Last]
