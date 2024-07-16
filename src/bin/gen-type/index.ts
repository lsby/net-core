import { randomUUID } from 'node:crypto'
import fs, { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { Log } from '@lsby/ts-log'
import { calcCode } from './calc-code'

export async function main(tsconfigPath: string, apiFolderPath: string, outputPath: string): Promise<void> {
  var log = new Log('@lsby:net-core').extend('gen-type')

  await log.debug('准备生成类型文件...')

  const tsconfigJson = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf8'))
  if (tsconfigJson.error) {
    throw new Error('无法解析 tsconfig.json')
  }
  const parsedTsconfig = ts.parseJsonConfigFileContent(tsconfigJson.config, ts.sys, path.resolve(tsconfigPath, '..'))
  await log.debug('成功解析 tsconfig 文件...')

  const projectHost = ts.createCompilerHost(parsedTsconfig.options)
  const project = ts.createProgram(parsedTsconfig.fileNames, parsedTsconfig.options, projectHost)
  await log.debug('成功读取项目...')

  const allSourceFiles = project.getSourceFiles()
  const apiSourceFiles = allSourceFiles.filter((sourceFile) => {
    // 我们约定接口蓝图必须名为 type.ts
    return new RegExp(`${apiFolderPath.replaceAll('\\', '\\\\')}.*type\.ts`).test(path.resolve(sourceFile.fileName))
  })
  await log.debug('找到 %o 个接口...', apiSourceFiles.length)

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
  await log.debug('成功生成虚拟计算文件...')

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
  await log.debug('成功生成虚拟项目...')

  const check = newProject.getTypeChecker()
  await log.debug('成功生成虚拟项目类型检查器...')

  const result: string[] = []
  for (var index = 0; index < apiSourceFiles.length; index++) {
    var apiSourceFile = apiSourceFiles[index]
    if (apiSourceFile == null) throw new Error('非预期的数组越界')

    await log.info(`处理（${index + 1} / ${apiSourceFiles.length}）：${apiSourceFile.fileName}`)

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
  await log.debug('成功处理所有接口...')

  const outputPathAbs = path.resolve(outputPath)
  var outDir = path.dirname(outputPathAbs)

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  var code = [
    `export type InterfaceType = [${result.join(',')}]`,
    '',
    `type 元组转联合<T> = T extends any[] ? T[number] : never`,
    '',
    `type 所有接口路径们<A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'path' extends keyof x`,
    `      ? [x['path'], ...所有接口路径们<xs>]`,
    `      : never`,
    `    : never`,
    `type Get接口路径们<A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'method' extends keyof x`,
    `      ? x['method'] extends 'get'`,
    `        ? 'path' extends keyof x`,
    `          ? [x['path'], ...所有接口路径们<xs>]`,
    `          : never`,
    `        : never`,
    `      : never`,
    `    : never`,
    `type Post接口路径们<A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'method' extends keyof x`,
    `      ? x['method'] extends 'post'`,
    `        ? 'path' extends keyof x`,
    `          ? [x['path'], ...所有接口路径们<xs>]`,
    `          : never`,
    `        : never`,
    `      : never`,
    `    : never`,
    ``,
    `type 从路径获得参数<Path, A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'path' extends keyof x`,
    `      ? x['path'] extends Path`,
    `        ? 'input' extends keyof x`,
    `          ? x['input']`,
    `          : never`,
    `        : 从路径获得参数<Path, xs>`,
    `      : never`,
    `    : never`,
    `type 从路径获得方法<Path, A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'path' extends keyof x`,
    `      ? x['path'] extends Path`,
    `        ? 'method' extends keyof x`,
    `          ? x['method']`,
    `          : never`,
    `        : 从路径获得方法<Path, xs>`,
    `      : never`,
    `    : never`,
    `type 从路径获得正确返回<Path, A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'path' extends keyof x`,
    `      ? x['path'] extends Path`,
    `        ? 'successOutput' extends keyof x`,
    `          ? x['successOutput']`,
    `          : never`,
    `        : 从路径获得正确返回<Path, xs>`,
    `      : never`,
    `    : never`,
    `type 从路径获得错误返回<Path, A = InterfaceType> = A extends []`,
    `  ? []`,
    `  : A extends [infer x, ...infer xs]`,
    `    ? 'path' extends keyof x`,
    `      ? x['path'] extends Path`,
    `        ? 'errorOutput' extends keyof x`,
    `          ? x['errorOutput']`,
    `          : never`,
    `        : 从路径获得错误返回<Path, xs>`,
    `      : never`,
    `  : never`,
    ``,
    `export type 请求后端函数类型 = <路径 extends 元组转联合<所有接口路径们>>(`,
    `  路径: 路径,`,
    `  参数: 从路径获得参数<路径>,`,
    `  方法: 从路径获得方法<路径>,`,
    `) => Promise<从路径获得正确返回<路径> | 从路径获得错误返回<路径>>`,
    `export type Get请求后端函数类型 = <路径 extends 元组转联合<Get接口路径们>>(`,
    `  路径: 路径,`,
    `  参数: 从路径获得参数<路径>,`,
    `) => Promise<从路径获得正确返回<路径> | 从路径获得错误返回<路径>>`,
    `export type Post请求后端函数类型 = <路径 extends 元组转联合<Post接口路径们>>(`,
    `  路径: 路径,`,
    `  参数: 从路径获得参数<路径>,`,
    `) => Promise<从路径获得正确返回<路径> | 从路径获得错误返回<路径>>`,
    '',
  ]

  fs.writeFileSync(outputPathAbs, code.join('\n'))
  await log.debug('生成成功：%o', outputPathAbs)
}
