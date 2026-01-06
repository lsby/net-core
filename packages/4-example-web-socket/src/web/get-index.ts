import * as esbuild from 'esbuild'
import path from 'path'

// 出于教学目的, 我不想引入复杂的工程配置
// 这里做一个简单的处理, 通过动态编译ts生成前端代码
function 编译ts(filePath: string): string {
  let result = esbuild.buildSync({
    entryPoints: [filePath],
    bundle: true,
    write: false,
    format: 'iife',
    target: 'es2020',
  })

  let 第一结果 = result.outputFiles[0]
  if (第一结果 === void 0) {
    throw new Error('编译失败')
  }

  return new TextDecoder().decode(第一结果.contents)
}

export function 生成主html(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebSocket 测试</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          h1 { text-align: center; }
        </style>
    </head>
    <body>
        <h1>WebSocket 测试</h1>
        <web-socket-test></web-socket-test>

        <script>
        ${编译ts(path.resolve(import.meta.dirname, './components/web-socket-test'))}
        </script>
    </body>
    </html>
  `
}
