import { InterfaceType } from '../types/interface-type'

type 找接口<
  P extends string,
  method extends 'get' | 'post',
  T extends readonly any[] = InterfaceType,
> = T extends readonly [infer F, ...infer Rest]
  ? F extends { path: P; method: method }
    ? F
    : 找接口<P, method, Rest>
  : never
type 取json输入<I> = I extends { input: { json: infer 输入 } } ? 输入 : never
type 取http错误输出<I> = I extends { errorOutput: infer 输出 } ? 输出 : never
type 取http正确输出<I> = I extends { successOutput: infer 输出 } ? 输出 : never
type 所有POST路径 = InterfaceType extends readonly (infer Item)[]
  ? Item extends { method: 'post'; path: infer P }
    ? P
    : never
  : never

export async function post<P extends 所有POST路径>(
  path: P,
  data: 取json输入<找接口<P, 'post'>>,
): Promise<取http错误输出<找接口<P, 'post'>> | 取http正确输出<找接口<P, 'post'>>> {
  let 响应 = await fetch('http://127.0.0.1:3000' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return await 响应.json()
}
