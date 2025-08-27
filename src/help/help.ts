export function 构造元组<T extends any[]>(args: [...T]): T {
  return args
}
export function 构造对象<K extends string, V>(key: K, value: V): Record<K, V> {
  return { [key]: value } as any
}
