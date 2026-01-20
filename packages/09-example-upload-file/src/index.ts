import { 接口, 接口逻辑, 服务器, 虚拟文件返回器 } from '@lsby/net-core'
import { Right } from '@lsby/ts-fp-data'
import { interfaceApiList } from './interface/interface-list'
import { 生成主html } from './web/get-index'

let 服务 = new 服务器({
  接口们: [
    ...interfaceApiList,
    new 接口(
      '/',
      'get',
      接口逻辑.构造([], async () => new Right({ fileContent: 生成主html(), MIMEType: 'text/html' })),
      new 虚拟文件返回器({}),
    ),
  ],
  端口: 3000,
})
let 服务信息 = await 服务.run()

console.log('服务器启动成功!')
console.log('API列表:', 服务信息.api)
console.log('服务器地址:', 服务信息.ip)
console.log('===========================')
console.log('测试方法:')
console.log('1. 浏览器访问 http://localhost:3000')
