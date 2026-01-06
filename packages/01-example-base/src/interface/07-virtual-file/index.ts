import { 接口, 接口逻辑, 虚拟文件返回器, 路径解析插件 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'

// =======================
// 虚拟文件返回示例
// =======================
// 这个示例展示了:
// - 使用虚拟文件返回器返回动态生成的文件内容

let 接口逻辑实现 = 接口逻辑.构造([new 路径解析插件()], async (参数, 逻辑附加参数, 请求附加参数) => {
  let log = 请求附加参数.log
  let { rawPath } = 参数.path

  // 演示：动态生成一个 SVG 图片
  let svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="0 0 350 350">
  <!-- 背景 -->
  <rect width="350" height="350" fill="#f0f0f0"/>

  <!-- 标题 -->
  <text x="175" y="40" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">
    虚拟文件返回器示例
  </text>

  <!-- 路径信息 -->
  <text x="175" y="80" font-size="14" text-anchor="middle" fill="#666">
    请求文件: ${rawPath}
  </text>

  <!-- 几何图形 -->
  <circle cx="100" cy="170" r="40" fill="#ff6b6b" opacity="0.8"/>
  <rect x="180" y="130" width="80" height="80" fill="#4ecdc4" opacity="0.8"/>
  <polygon points="175,240 210,290 140,290" fill="#ffe66d" opacity="0.8"/>

  <!-- 时间戳 -->
  <text x="175" y="330" font-size="12" text-anchor="middle" fill="#999">
    生成时间: ${new Date().toLocaleString()}
  </text>
</svg>
`

  await log.info('生成虚拟SVG图片')

  return new Right({ fileContent: Buffer.from(svgContent), MIMEType: 'image/svg+xml' })
})

// 本例中, 使用内置的"虚拟文件返回器"来返回数据
// 它要求"接口逻辑"正确情况下必须返回 { fileContent: string | Buffer, MIMEType: string }, 错误情况下必须返回 string
let 接口返回器 = new 虚拟文件返回器({ 缓存控制: 'no-cache, must-revalidate' })

export default new 接口('/virtual/demo.svg', 'get', 接口逻辑实现, 接口返回器)
