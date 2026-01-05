// =========
// 值计算
// =========
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

export function 数组合并<T extends readonly any[][]>(
  ...数组们: T
): Array<{ [K in keyof T]: T[K] extends (infer U)[] ? U : never }> {
  if (数组们.length === 0) return []
  let 最大长度 = Math.max(...数组们.map((a) => a.length))
  let 结果: any[] = []
  for (let i = 0; i < 最大长度; i++) {
    结果.push(数组们.map((a) => a[i]))
  }
  return 结果
}

// =========
// 类型计算
// =========
export type 去除只读<T> = T extends readonly [...infer U] ? U : never
export type 类型相等<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer U) => any ? U : never
type LastUnion<T> = UnionToIntersection<T extends any ? (x: T) => any : never> extends (x: infer L) => any ? L : never
export type 联合转元组<T, Last = LastUnion<T>> = [T] extends [never] ? [] : [...联合转元组<Exclude<T, Last>>, Last]

export type 数组包含<T extends readonly any[], U> = T extends [infer 第一个, ...infer 剩余]
  ? 类型相等<第一个, U> extends true
    ? true
    : 数组包含<剩余, U>
  : false

export type 对象去重<T> = { [K in keyof T]: T[K] }
export type 数组去重<T extends readonly any[], 结果 extends readonly any[] = []> = T extends [
  infer 第一个,
  ...infer 剩余,
]
  ? 数组包含<结果, 第一个> extends true
    ? 数组去重<剩余, 结果>
    : 数组去重<剩余, [...结果, 第一个]>
  : 结果
