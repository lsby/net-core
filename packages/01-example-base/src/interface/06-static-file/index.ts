import { 接口, 接口逻辑, 路径解析插件, 静态文件返回器 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import path from 'node:path'

// =======================
// 静态文件返回示例
// =======================
// 这个示例展示了:
// - 使用正则表达式匹配路由
// - 使用静态文件返回器返回文件
// - 支持自定义MIME类型和缓存控制

// 使用内置的"路径解析插件"解析路径
let 接口逻辑实现 = 接口逻辑.构造([new 路径解析插件()], async (参数, 逻辑附加参数, 请求附加参数) => {
  let log = 请求附加参数.log

  await log.info('路径解析结果: %O', 参数.path)

  // 可以通过路径决定返回什么文件
  // 这里简单的返回当前源代码
  let 文件路径 = path.resolve(import.meta.dirname, 'index.ts')
  await log.info('返回静态文件: %s', 文件路径)

  return new Right({ filePath: 文件路径 })
})

// 本例中, 使用内置的"静态文件返回器"来返回数据
// 它要求"接口逻辑"正确情况下必须返回 { filePath: string }, 错误情况下必须返回 string
// 该返回器会自动读取文件内容, 并以合理的MIME类型返回
// 不推荐用该接口做文件下载, 因为它不是以文件流返回的, 大文件会消耗过多内存
let 接口返回器 = new 静态文件返回器({
  MIME类型映射: { '.ts': 'text/markdown; charset=utf-8' },
  缓存控制: 'public, max-age=3600',
})

// 接口路径可以写正则表达式
// 本例中, 使用正则表达式匹配所有以 /static/ 开头的路径
// 注意: 正则路径的接口不会出现在生成的类型文件中
export default new 接口(/^\/static\/.+$/, 'get', 接口逻辑实现, 接口返回器)
