import { 任意接口, 合并JSON插件结果, 获得接口逻辑插件类型, 获得接口逻辑类型 } from '@lsby/net-core'

export async function POST请求用例<接口类型 extends 任意接口>(
  接口类型描述: 接口类型,
  参数: 合并JSON插件结果<获得接口逻辑插件类型<获得接口逻辑类型<接口类型>>> extends infer 参数
    ? 'body' extends keyof 参数
      ? 参数['body']
      : {}
    : never,
): Promise<object> {
  let urlPath = 接口类型描述.获得路径() as string
  let url = `http://127.0.0.1:3000${urlPath}`

  let headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(参数) })
  return await response.json()
}
