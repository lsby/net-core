import { 接口, 接口逻辑, 服务器 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { interfaceApiList } from './interface/interface-list'
import { CORS选项返回器 } from './lib/cors'

// 创建服务器实例
let 服务 = new 服务器({
  接口们: [
    // cors排在最前面, 处理options
    new 接口(
      /.*/,
      'options',
      接口逻辑.构造([], async () => {
        return new Right({})
      }),
      new CORS选项返回器({
        allowMethods: 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
        allowHeaders: 'Content-Type, Authorization, X-Custom-Header',
        maxAge: '86400',
      }),
    ),
    ...interfaceApiList,
  ],
  端口: 3000,
})

// 启动服务器并获取服务信息
let 服务信息 = await 服务.run()

// 输出服务器启动信息
console.log('服务器启动成功!')
console.log('API列表:', 服务信息.api)
console.log('服务器地址:', 服务信息.ip)
console.log('===========================')
console.log('说明:')
console.log('- 所有路径都支持 OPTIONS 预检请求')
console.log('- CORS 响应头已自动配置')
console.log('- 客户端可以从任何域名进行跨域请求')
