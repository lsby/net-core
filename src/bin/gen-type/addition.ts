export let 附加代码 = `
export type 元组转联合<T> = T extends any[] ? T[number] : never

export type 所有接口路径们<A = InterfaceType> = A extends []
  ? []
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? [x['path'], ...所有接口路径们<xs>]
      : never
    : never
type Get接口路径们<A = InterfaceType> = A extends []
  ? []
  : A extends [infer x, ...infer xs]
    ? 'method' extends keyof x
      ? x['method'] extends 'get'
        ? 'path' extends keyof x
          ? [x['path'], ...Get接口路径们<xs>]
          : never
        : never
      : never
    : never
export type Post接口路径们<A = InterfaceType> = A extends []
  ? []
  : A extends [infer x, ...infer xs]
    ? 'method' extends keyof x
      ? x['method'] extends 'post'
        ? 'path' extends keyof x
          ? [x['path'], ...Post接口路径们<xs>]
          : never
        : never
      : never
    : never

export type 从路径获得参数<Path, A = InterfaceType> = A extends []
  ? never
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? x['path'] extends Path
        ? 'input' extends keyof x
          ? x['input']
          : never
        : 从路径获得参数<Path, xs>
      : never
    : never
export type 从路径获得WS参数<Path, A = InterfaceWsType> = A extends []
  ? never
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? x['path'] extends Path
        ? 'data' extends keyof x
          ? x['data']
          : never
        : 从路径获得WS参数<Path, xs>
      : never
    : never
export type 从路径获得方法<Path, A = InterfaceType> = A extends []
  ? never
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? x['path'] extends Path
        ? 'method' extends keyof x
          ? x['method']
          : never
        : 从路径获得方法<Path, xs>
      : never
    : never
export type 从路径获得正确返回<Path, A = InterfaceType> = A extends []
  ? never
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? x['path'] extends Path
        ? 'successOutput' extends keyof x
          ? x['successOutput']
          : never
        : 从路径获得正确返回<Path, xs>
      : never
    : never
export type 从路径获得错误返回<Path, A = InterfaceType> = A extends []
  ? never
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? x['path'] extends Path
        ? 'errorOutput' extends keyof x
          ? x['errorOutput']
          : never
        : 从路径获得错误返回<Path, xs>
      : never
    : never
export type 从路径获得泛化的错误返回<Path, A = InterfaceType> = A extends []
  ? never
  : A extends [infer x, ...infer xs]
    ? 'path' extends keyof x
      ? x['path'] extends Path
        ? 'errorOutput' extends keyof x
          ? 'data' extends keyof x['errorOutput']
            ? { status: 'fail'; data: x['errorOutput']['data'] | string }
            : never
          : never
        : 从路径获得错误返回<Path, xs>
      : never
    : never

export type 请求后端函数类型 = <路径 extends 元组转联合<所有接口路径们>>(
  路径: 路径,
  参数: 从路径获得参数<路径>,
  方法: 从路径获得方法<路径>,
) => Promise<从路径获得正确返回<路径> | 从路径获得错误返回<路径>>
export type Get请求后端函数类型 = <路径 extends 元组转联合<Get接口路径们>>(
  路径: 路径,
  参数: 从路径获得参数<路径>,
) => Promise<从路径获得正确返回<路径> | 从路径获得错误返回<路径>>
export type Post请求后端函数类型 = <路径 extends 元组转联合<Post接口路径们>>(
  路径: 路径,
  参数: 从路径获得参数<路径>,
  ws信息回调?: (信息: 从路径获得WS参数<路径>) => void,
  ws关闭回调?: (信息: CloseEvent) => void,
  ws错误回调?: (信息: Event) => void,
) => Promise<从路径获得正确返回<路径> | 从路径获得错误返回<路径>>
`
