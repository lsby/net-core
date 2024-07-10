import { randomUUID } from 'node:crypto'
import fs, { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { Task } from '@lsby/ts-fp-data'
import { Log } from '../../tools/log'
import { calcCode } from './calc-code'

export function main(tsconfigPath: string, apiFolderPath: string, outputPath: string): Promise<void> {
  return new Task(async () => {
    var log = new Log('@lsby:net-core').extend('gen-type')

    const tsconfigJson = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf8'))
    if (tsconfigJson.error) {
      throw new Error('无法解析 tsconfig.json')
    }
    const parsedTsconfig = ts.parseJsonConfigFileContent(tsconfigJson.config, ts.sys, path.resolve(tsconfigPath, '..'))
    await log.debug('成功解析 tsconfig 文件...').run()

    const projectHost = ts.createCompilerHost(parsedTsconfig.options)
    const project = ts.createProgram(parsedTsconfig.fileNames, parsedTsconfig.options, projectHost)
    await log.debug('成功读取项目...').run()

    const allSourceFiles = project.getSourceFiles()
    const apiSourceFiles = allSourceFiles.filter((sourceFile) => {
      // 我们约定接口蓝图必须名为 type.ts
      return new RegExp(`${apiFolderPath.replaceAll('\\', '\\\\')}.*type\.ts`).test(path.resolve(sourceFile.fileName))
    })
    await log.debug('找到 %o 个接口...', apiSourceFiles.length).run()

    // 为每一个接口文件生成一个虚拟计算文件
    const apiTypeCalcFileNames = apiSourceFiles.map((sourceFile) =>
      sourceFile.fileName.replace('type.ts', `type-calculate-${randomUUID()}.ts`),
    )
    const apiTypeCalcFiles = apiTypeCalcFileNames.map((filename) => {
      return {
        name: filename,
        sourceFile: ts.createSourceFile(filename, calcCode, ts.ScriptTarget.Latest),
      }
    })
    await log.debug('成功生成虚拟计算文件...').run()

    const newProject = ts.createProgram({
      rootNames: [...parsedTsconfig.fileNames, ...apiTypeCalcFileNames],
      options: parsedTsconfig.options,
      host: {
        ...projectHost,
        getSourceFile: (filename) => {
          const apiTypeCalcSourceFile = apiTypeCalcFiles.find(
            (apiTypeCalcSourceFile) => apiTypeCalcSourceFile.name === filename,
          )
          if (apiTypeCalcSourceFile !== undefined) {
            return apiTypeCalcSourceFile.sourceFile
          }
          return project.getSourceFile(filename)
        },
      },
      oldProgram: project,
    })
    await log.debug('成功生成虚拟项目...').run()

    const check = newProject.getTypeChecker()
    await log.debug('成功生成虚拟项目类型检查器...').run()

    const result: string[] = []
    for (var index = 0; index < apiSourceFiles.length; index++) {
      var apiSourceFile = apiSourceFiles[index]
      if (apiSourceFile == null) throw new Error('非预期的数组越界')

      await log.info(`处理（${index + 1} / ${apiSourceFiles.length}）：${apiSourceFile.fileName}`).run()

      const apiCalcSourceFile = apiTypeCalcFiles[index]?.sourceFile
      if (apiCalcSourceFile === undefined) {
        throw new Error('非预期的数组越界')
      }

      for (const node of apiCalcSourceFile.statements) {
        if (ts.isExportAssignment(node) && node.isExportEquals === undefined) {
          const apiType = check.getTypeAtLocation(node.expression)
          const typeString = check.typeToString(
            apiType,
            undefined,
            ts.TypeFormatFlags.NoTruncation |
              ts.TypeFormatFlags.AllowUniqueESSymbolType |
              ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
          )
          result.push(typeString)
        }
      }
    }
    await log.debug('成功处理所有接口...').run()

    const outputPathAbs = path.resolve(outputPath)
    var outDir = path.dirname(outputPathAbs)

    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true })
    }

    fs.writeFileSync(outputPathAbs, `export type InterfaceType = [${result.join(',')}]`)
    await log.debug('生成成功：%o', outputPathAbs).run()
  }).run()
}
