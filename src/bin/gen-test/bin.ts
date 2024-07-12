#!/usr/bin/env node
import path from 'node:path'
import { Command } from 'commander'
import { main } from '.'

const program = new Command()

program
  .name('生成测试文件')
  .argument('<tsconfigPath>', 'tsconfig文件路径')
  .argument('<interfaceFolderPath>', '接口文件夹路径')
  .argument('<outFilePath>', '输出文件路径')
  .argument('<filter>', '过滤器(正则)')
  .action(async (tsconfigPath: string, interfaceFolderPath: string, outFilePath: string, filter: string) => {
    const absoluteTsconfigPath = path.resolve(tsconfigPath)
    const absoluteApiFolderPath = path.resolve(interfaceFolderPath)
    const absoluteOutputPath = path.resolve(outFilePath)
    await main(absoluteTsconfigPath, absoluteApiFolderPath, absoluteOutputPath, filter)
  })

program.parse(process.argv)
