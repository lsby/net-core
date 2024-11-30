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
      if (数据.hasOwnProperty(key)) 新数据[key] = 递归截断字符串(数据[key])
    }
    return 新数据
  }
  return 数据
}
