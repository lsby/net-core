import { afterAll } from 'vitest'
import { App } from '../src/app/app'
import { 设置请求基础地址 } from '../src/tools/request'

let server = await new App().run(0)
let 地址 = server.address()

if (地址 === null || typeof 地址 === 'string') {
  throw new Error('无法获得测试服务器端口')
}

设置请求基础地址(`http://127.0.0.1:${地址.port}`)

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === void 0 ? resolve() : reject(error)))
  })
})
