import { 服务器 } from '@lsby/net-core'
import { interfaceApiList } from './interface/interface-list'

// 创建服务器实例
let 服务 = new 服务器({ 接口们: interfaceApiList, 端口: 3000 })

// 启动服务器并获取服务信息
let 服务信息 = await 服务.run()

// 输出服务器启动信息
console.log('服务器启动成功!')
console.log('API列表:', 服务信息.api) // 已注册的 API 路径列表
console.log('服务器地址:', 服务信息.ip) // 本机可访问的 IP 地址列表
console.log('===========================')
console.log('测试方法:')
console.log(
  '1. curl -X POST http://localhost:3000/api/calculate-add -H "Content-Type: application/json" -d \'{"a": 1, "b": 2}\'',
)
console.log(
  '2. curl -X POST http://localhost:3000/api/calculate-sub -H "Content-Type: application/json" -d \'{"a": 2, "b": 1}\'',
)
console.log('3. 浏览器访问 http://localhost:3000/api/pure-string?name=world')
