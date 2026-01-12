import { 服务器 } from '@lsby/net-core'
import { interfaceApiList } from './interface/interface-list'

let 服务 = new 服务器({ 接口们: interfaceApiList, 端口: 3000 })
let 服务信息 = await 服务.run()

console.log('服务器启动成功!')
console.log('API列表:', 服务信息.api)
console.log('服务器地址:', 服务信息.ip)
console.log('===========================')
console.log('测试方法:')
console.log('1. 执行命令: npm run _gen:api:type, 生成类型文件')
