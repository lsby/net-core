#!/usr/bin/env node
import path from 'node:path'
import { Command } from 'commander'
import { main } from '.'

let program = new Command()

program
  .name('生成测试文件')
  .argument('<tsconfigPath>', 'tsconfig文件路径')
  .argument('<interfaceFolderPath>', '接口文件夹路径')
  .argument('<outFilePath>', '输出文件路径')
  .action(async (tsconfigPath: string, interfaceFolderPath: string, outFilePath: string) => {
    let absoluteTsconfigPath = path.resolve(tsconfigPath)
    let absoluteApiFolderPath = path.resolve(interfaceFolderPath)
    let absoluteOutputPath = path.resolve(outFilePath)
    await main(absoluteTsconfigPath, absoluteApiFolderPath, absoluteOutputPath)
  })

program.parse(process.argv)
