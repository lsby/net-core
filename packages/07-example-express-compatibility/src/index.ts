import { 服务器 } from '@lsby/net-core'
import { interfaceApiList } from './interface/interface-list'

// 创建服务器实例
let 服务 = new 服务器({ 接口们: interfaceApiList, 端口: 3000 })

// 启动服务器并获取服务信息
let 服务信息 = await 服务.run()

// 输出服务器启动信息
console.log('服务器启动成功!')
console.log('API列表:', 服务信息.api)
console.log('服务器地址:', 服务信息.ip)
