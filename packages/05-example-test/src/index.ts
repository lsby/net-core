#!/usr/bin/env node
import { App } from './app/app'

new App().run().catch(console.error)

console.log('===========================')
console.log('测试方法:')
console.log('1. 执行命令: npm run test:gen:all, 生成测试文件')
console.log('或. 执行命令: npm run test:gen <接口名称正则, 例如 add>, 通过正则筛选生成测试文件')
console.log('2. 执行命令: npm run test:run:unit, 运行单元测试')
console.log('或. 执行命令: npm run test:run:coverage, 运行覆盖率测试')
