import fs, { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { Task } from '@lsby/ts-fp-data'
import { Log } from '../../tools/log'

export function main(tsconfigPath: string, interfaceFolderPath: string, outFilePath: string): Promise<void> {
  return new Task(async () => {
    var log = new Log('@lsby:net-core').extend('gen-list')

    const 项目根路径 = path.dirname(tsconfigPath)

    const tsconfigJson = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf8'))
    if (tsconfigJson.error) {
      throw new Error('无法解析 tsconfig.json')
    }
    const parsedTsconfig = ts.parseJsonConfigFileContent(tsconfigJson.config, ts.sys, path.resolve(tsconfigPath, '..'))
    await log.debug('成功解析 tsconfig 文件...').run()

    const projectHost = ts.createCompilerHost(parsedTsconfig.options)
    const project = ts.createProgram(parsedTsconfig.fileNames, parsedTsconfig.options, projectHost)
    await log.debug('成功读取项目...').run()

    // 不可以删除, 否则会变得不幸
    const _check = project.getTypeChecker()

    const 所有源文件 = project.getSourceFiles()
    const 接口类型文件们 = 所有源文件.filter((sourceFile) => {
      // 我们约定接口类型必须名为 type.ts
      return new RegExp(`${interfaceFolderPath.replaceAll('\\', '\\\\')}.*type\.ts`).test(
        path.resolve(sourceFile.fileName),
      )
    })
    const 接口实现文件们 = 所有源文件.filter((sourceFile) => {
      // 我们约定接口实现必须名为 index.ts
      return new RegExp(`${interfaceFolderPath.replaceAll('\\', '\\\\')}.*index\.ts`).test(
        path.resolve(sourceFile.fileName),
      )
    })

    await log.debug('找到 %o 个接口', 接口类型文件们.length).run()

    const 引入区: string[] = []
    const 代码区: string[] = []
    for (var i = 0; i < 接口实现文件们.length; i++) {
      var 接口实现文件 = 接口实现文件们[i]
      if (接口实现文件 == null) throw new Error('非预期的数组越界')

      const filenameRelativeToApiFolder = path
        .relative(interfaceFolderPath, 接口实现文件.fileName)
        .replaceAll('\\', '/')
      const importName = filenameRelativeToApiFolder
        .replaceAll('/', '_')
        .replaceAll('.ts', '')
        .replaceAll('./', '')
        .replaceAll('-', '_')
      const filenameRelativeToProjectRoot = path
        .relative(项目根路径, 接口实现文件.fileName)
        .replaceAll('\\', '/')
        .replaceAll('.ts', '')
      const outputFolderRelativeToProjectRoot = path
        .relative(path.dirname(outFilePath), 项目根路径)
        .replaceAll('\\', '/')
      const importPath = path
        .join(outputFolderRelativeToProjectRoot, filenameRelativeToProjectRoot)
        .replaceAll('\\', '/')

      await log.info(`处理（${i + 1} / ${接口实现文件们.length}）：${filenameRelativeToApiFolder}`).run()

      for (const node of 接口实现文件.statements) {
        if (ts.isExportAssignment(node) && node.isExportEquals === undefined) {
          const expression = node.expression
          if (ts.isNewExpression(expression) && expression.expression.getText() === '接口') {
            break
          }
          throw new Error(`${接口实现文件.fileName}：默认导出不是 接口`)
        }
      }

      引入区.push(`import * as ${importName} from '${importPath}'`)
      代码区.push(`${importName}.default`)
    }

    const finalTestFile = [
      // ..
      `import { 任意接口 } from '@lsby/net-core'`,
      '',
      ...引入区,
      '',
      `export var interfaceList: 任意接口[] = [\n${代码区.map((a) => `  ${a}`).join(',\n')}\n]`,
      '',
    ].join('\n')

    var outDir = path.dirname(outFilePath)
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true })
    }

    writeFileSync(outFilePath, finalTestFile)
  }).run()
}
