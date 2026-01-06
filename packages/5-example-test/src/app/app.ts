import { 服务器 } from '@lsby/net-core'
import { interfaceApiList } from '../interface/interface-list'

export class App {
  public async run(): Promise<void> {
    let 服务 = new 服务器({ 接口们: interfaceApiList, 端口: 3000 })
    let 服务信息 = await 服务.run()

    console.log('服务器启动成功!')
    console.log('API列表:', 服务信息.api)
    console.log('服务器地址:', 服务信息.ip)
    console.log('===========================')
    console.log('测试方法:')
    console.log('1. 执行命令: test:gen:all, 生成测试文件')
    console.log('或. 执行命令: test:gen <接口名称正则, 例如 add>, 通过正则筛选生成测试文件')
    console.log('2. 执行命令: test:run:unit, 运行单元测试')
    console.log('或. 执行命令: test:run:coverage, 运行覆盖率测试')
    console.log('3. 执行命令: test:run:pure, 运行纯逻辑测试')
  }
}
