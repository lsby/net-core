// =========
// 值计算
// =========
export function 构造元组<T extends any[]>(args: [...T]): T {
  return args
}
export function 构造对象<K extends string, V>(key: K, value: V): Record<K, V> {
  return { [key]: value } as any
}

/**
 * 深合并两个对象，如果两个值都是普通对象，则递归合并，否则用后者覆盖
 * 只有直接上游是对象原型的对象才算是普通对象
 */
export function 普通对象深合并(target: Record<any, any>, source: Record<any, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof source !== 'object' || source === null || Object.getPrototypeOf(source) !== Object.prototype) {
    return source
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof target !== 'object' || target === null || Object.getPrototypeOf(target) !== Object.prototype) {
    return source
  }
  let result = { ...target }
  for (let key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        Object.getPrototypeOf(source[key]) === Object.prototype &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        Object.getPrototypeOf(target[key]) === Object.prototype
      ) {
        result[key] = 普通对象深合并(target[key], source[key])
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result[key] = source[key]
      }
    }
  }
  return result
}

// =========
// 类型计算
// =========
type 普通对象 = Record<any, any>
export type 严格递归合并对象<A, B> = A extends 普通对象
  ? B extends 普通对象
    ? {
        [K in keyof A | keyof B]: K extends keyof A
          ? K extends keyof B
            ? A[K] extends 普通对象
              ? B[K] extends 普通对象
                ? 严格递归合并对象<A[K], B[K]> // 两边都是对象
                : never // B[K] 不是对象 坍缩
              : never // A[K] 不是对象 坍缩
            : A[K] // 只有 A 有
          : K extends keyof B
            ? B[K] // 只有 B 有
            : never // A 和 B 都没有 K, 理论上不可能
      }
    : never
  : never
