import { Log } from '@lsby/ts-log'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { 附加代码 } from './addition'

function 检查存在默认导出(源文件: ts.SourceFile): boolean {
  for (let statement of 源文件.statements) {
    if (ts.isExportAssignment(statement) && (statement.isExportEquals ?? null) === null) {
      return true
    }
  }
  return false
}

export async function main(tsconfig路径: string, 目标路径: string, 输出文件路径: string): Promise<void> {
  let log = new Log('@lsby:net-core').extend('gen-api-type')

  await log.debug('开始生成类型...')
  await log.debug(`tsconfig路径: ${tsconfig路径}`)
  await log.debug(`目标路径: ${目标路径}`)
  await log.debug(`输出文件路径: ${输出文件路径}`)

  let tsconfig内容 = ts.parseConfigFileTextToJson(tsconfig路径, fs.readFileSync(tsconfig路径, 'utf8'))
  let tsconfig内容错误 = tsconfig内容.error ?? null
  if (tsconfig内容错误 !== null) {
    await log.error('无法解析 tsconfig.json: ' + tsconfig内容错误.messageText)
    throw new Error('无法解析 tsconfig.json')
  }
  let 解析后的tsconfig = ts.parseJsonConfigFileContent(tsconfig内容.config, ts.sys, path.resolve(tsconfig路径, '..'))
  await log.debug('成功解析 tsconfig 文件...')

  let 项目主机 = ts.createCompilerHost(解析后的tsconfig.options)
  let 项目 = ts.createProgram(解析后的tsconfig.fileNames, 解析后的tsconfig.options, 项目主机)
  await log.debug('成功读取项目...')

  let 所有源文件 = 项目.getSourceFiles()
  let 相关源文件们 = 所有源文件.filter((源文件) => {
    let 源文件路径 = path.normalize(源文件.fileName)
    if (源文件路径.includes(目标路径) === false) return false
    let 存在默认导出 = 检查存在默认导出(源文件)
    if (存在默认导出 === false) return false
    return true
  })
  await log.debug(`筛选出 ${相关源文件们.length} 个相关源文件`)

  let 伴随的虚拟文件们 = 相关源文件们.map((a) => {
    let 代码 = `
      import {
        取第一个WS插件结果,
        合并JSON插件结果,
        获得接口方法类型,
        获得接口正确形式,
        获得接口路径类型,
        获得接口逻辑插件类型,
        获得接口逻辑类型,
        获得接口错误形式,
        GetNetCoreExportTypeName,
        GetNetCoreExportTypeDefine
      } from '@lsby/net-core'
      import 导入 from "./${a.fileName.split('/').at(-1)?.replaceAll('.ts', '')}"

      type jsonPath = 获得接口路径类型<typeof 导入>
      type jsonMethod = 获得接口方法类型<typeof 导入>
      type jsonInput = 合并JSON插件结果<获得接口逻辑插件类型<获得接口逻辑类型<typeof 导入>>>
      type jsonErrorOutput = 获得接口错误形式<typeof 导入>
      type jsonSuccessOutput = 获得接口正确形式<typeof 导入>
      type JSON接口计算结果 = jsonPath extends infer _
        ? jsonMethod extends infer _
          ? jsonInput extends infer _
            ? jsonErrorOutput extends infer _
              ? jsonSuccessOutput extends infer _
                ? {
                    path: jsonPath
                    method: jsonMethod
                    input: jsonInput
                    errorOutput: jsonErrorOutput
                    successOutput: jsonSuccessOutput
                  }
                : never
              : never
            : never
          : never
        : never

      type wsPath = 获得接口路径类型<typeof 导入>
      type wsData = 取第一个WS插件结果<获得接口逻辑插件类型<获得接口逻辑类型<typeof 导入>>>
      type WS接口计算结果 = wsPath extends infer _
        ? wsData extends infer _
          ? wsData extends Record<string, never>
            ? never
            : {
                path: wsPath
                data: wsData
              }
          : never
        : never

      type 导出类型名称 = GetNetCoreExportTypeName<导入>
      type 导出类型定义 = GetNetCoreExportTypeDefine<导入>
    `
    return ts.createSourceFile(a.fileName.replaceAll('.ts', '-' + randomUUID() + '.ts'), 代码, ts.ScriptTarget.Latest)
  })

  let 新项目 = ts.createProgram({
    rootNames: [...项目.getSourceFiles().map((a) => a.fileName), ...伴随的虚拟文件们.map((a) => a.fileName)],
    options: 解析后的tsconfig.options,
    host: {
      ...项目主机,
      getSourceFile: (filename) => {
        let 找到的虚拟文件 = 伴随的虚拟文件们.find((a) => a.fileName === filename) ?? null
        if (找到的虚拟文件 !== null) return 找到的虚拟文件
        return 项目.getSourceFile(filename)
      },
    },
    oldProgram: 项目,
  })
  let 类型检查器 = 新项目.getTypeChecker()

  let JSON结果: string[] = []
  let WS结果: string[] = []
  let 导出类型: string[] = []
  for (let 源文件 of 伴随的虚拟文件们) {
    ts.forEachChild(源文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === 'JSON接口计算结果') {
        let type = 类型检查器.getTypeAtLocation(node)
        JSON结果.push(
          类型检查器.typeToString(
            type,
            void 0,
            ts.TypeFormatFlags.NoTruncation |
              ts.TypeFormatFlags.NoTypeReduction |
              ts.TypeFormatFlags.AllowUniqueESSymbolType |
              ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
          ),
        )
      } else if (ts.isTypeAliasDeclaration(node) && node.name.text === 'WS接口计算结果') {
        let type = 类型检查器.getTypeAtLocation(node)
        WS结果.push(
          类型检查器.typeToString(
            type,
            void 0,
            ts.TypeFormatFlags.NoTruncation |
              ts.TypeFormatFlags.NoTypeReduction |
              ts.TypeFormatFlags.AllowUniqueESSymbolType |
              ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
          ),
        )
      }
    })

    let 导出类型名称: string | undefined = void 0
    let 导出类型定义: string | undefined = void 0
    ts.forEachChild(源文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '导出类型名称') {
        let type = 类型检查器.getTypeAtLocation(node)
        let 字符串结果 = 类型检查器.typeToString(
          type,
          void 0,
          ts.TypeFormatFlags.NoTruncation |
            ts.TypeFormatFlags.NoTypeReduction |
            ts.TypeFormatFlags.AllowUniqueESSymbolType |
            ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
        )
        if (字符串结果 !== 'unknown') {
          导出类型名称 = JSON.parse(字符串结果) as string
        }
      }
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '导出类型定义') {
        let type = 类型检查器.getTypeAtLocation(node)
        let 字符串结果 = 类型检查器.typeToString(
          type,
          void 0,
          ts.TypeFormatFlags.NoTruncation |
            ts.TypeFormatFlags.NoTypeReduction |
            ts.TypeFormatFlags.AllowUniqueESSymbolType |
            ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
        )
        if (字符串结果 !== 'unknown') {
          导出类型定义 = type.symbol.declarations?.[0]?.getText()
        }
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (导出类型名称 !== void 0 && 导出类型定义 !== void 0) {
      导出类型.push(`export type ${导出类型名称} = ${导出类型定义}`)
    }
  }

  let 最终结果_JSON = Array.from(new Set(JSON结果.filter((a) => a !== 'any' && a !== 'never' && a !== 'unknown')))
  await log.debug(`最终筛选出 ${最终结果_JSON.length} 个json接口类型`)

  let 最终结果_WS = Array.from(new Set(WS结果.filter((a) => a !== 'any' && a !== 'never' && a !== 'unknown')))
  await log.debug(`最终筛选出 ${最终结果_WS.length} 个ws接口类型`)

  let 最终结果_导出类型 = Array.from(new Set(导出类型.filter((a) => a !== 'any' && a !== 'never' && a !== 'unknown')))
  await log.debug(`最终筛选出 ${最终结果_导出类型.length} 个导出类型`)

  let 最终代码 = [
    ...最终结果_导出类型,
    `export type InterfaceType = [${最终结果_JSON.join(',')}]`,
    `export type InterfaceWsType = [${最终结果_WS.join(',')}]`,
    附加代码,
  ]

  await log.debug('最终代码生成完成')

  let 输出文件夹 = path.dirname(输出文件路径)
  if (fs.existsSync(输出文件夹) === false) fs.mkdirSync(输出文件夹, { recursive: true })
  fs.writeFileSync(输出文件路径, 最终代码.join('\n'))

  await log.debug(`输出文件写入完成: ${输出文件路径}`)
}
