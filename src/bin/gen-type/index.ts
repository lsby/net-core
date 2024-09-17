import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { Log } from '@lsby/ts-log'
import { 附加代码 } from './addition'

function 检查存在默认导出(源文件: ts.SourceFile): boolean {
  for (const statement of 源文件.statements) {
    if (ts.isExportAssignment(statement) && statement.isExportEquals === undefined) {
      return true
    }
  }
  return false
}

export async function main(tsconfig路径: string, 目标路径: string, 输出文件路径: string): Promise<void> {
  var log = new Log('@lsby:net-core').extend('gen-type')

  await log.debug('开始生成类型...')
  await log.debug(`tsconfig路径: ${tsconfig路径}`)
  await log.debug(`目标路径: ${目标路径}`)
  await log.debug(`输出文件路径: ${输出文件路径}`)

  const tsconfig内容 = ts.parseConfigFileTextToJson(tsconfig路径, fs.readFileSync(tsconfig路径, 'utf8'))
  if (tsconfig内容.error) {
    await log.err('无法解析 tsconfig.json: ' + tsconfig内容.error.messageText)
    throw new Error('无法解析 tsconfig.json')
  }
  const 解析后的tsconfig = ts.parseJsonConfigFileContent(tsconfig内容.config, ts.sys, path.resolve(tsconfig路径, '..'))
  await log.debug('成功解析 tsconfig 文件...')

  const 项目主机 = ts.createCompilerHost(解析后的tsconfig.options)
  const 项目 = ts.createProgram(解析后的tsconfig.fileNames, 解析后的tsconfig.options, 项目主机)
  await log.debug('成功读取项目...')

  var 所有源文件 = 项目.getSourceFiles()
  var 相关源文件们 = 所有源文件.filter((源文件) => {
    var 源文件路径 = path.normalize(源文件.fileName)
    if (!源文件路径.includes(目标路径)) return false
    var 存在默认导出 = 检查存在默认导出(源文件)
    if (!存在默认导出) return false
    return true
  })
  await log.debug(`筛选出 ${相关源文件们.length} 个相关源文件`)

  var 伴随的虚拟文件们 = 相关源文件们.map((a) => {
    var 代码 = [
      `import { 接口类型, 合并JSON插件结果 } from '@lsby/net-core'`,
      `import { z } from 'zod'`,
      `import 导入 from "./${a.fileName.split('/').at(-1)?.replaceAll('.ts', '')}"`,
      ``,
      `
        type 计算结果 =
          typeof 导入 extends 接口类型<infer Path, infer Method, infer PreApis, infer SuccessSchema, infer ErrorSchema>
            ? Path extends string
              ? {
                  path: Path
                  method: Method
                  input: 合并JSON插件结果<PreApis>
                  successOutput: z.infer<SuccessSchema>
                  errorOutput: z.infer<ErrorSchema>
                }
              : never
            : never
        `,
    ]
    return ts.createSourceFile(
      a.fileName.replaceAll('.ts', '-' + randomUUID() + '.ts'),
      代码.join('\n'),
      ts.ScriptTarget.Latest,
    )
  })

  const 新项目 = ts.createProgram({
    rootNames: [...项目.getSourceFiles().map((a) => a.fileName), ...伴随的虚拟文件们.map((a) => a.fileName)],
    options: 解析后的tsconfig.options,
    host: {
      ...项目主机,
      getSourceFile: (filename) => {
        const 找到的虚拟文件 = 伴随的虚拟文件们.find((a) => a.fileName == filename)
        if (找到的虚拟文件 != null) return 找到的虚拟文件
        return 项目.getSourceFile(filename)
      },
    },
    oldProgram: 项目,
  })
  var 类型检查器 = 新项目.getTypeChecker()

  var 检查结果: string[] = []
  for (var 源文件 of 伴随的虚拟文件们) {
    ts.forEachChild(源文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '计算结果') {
        const type = 类型检查器.getTypeAtLocation(node)
        检查结果.push(类型检查器.typeToString(type))
      }
    })
  }

  var 最终结果 = Array.from(new Set(检查结果.filter((a) => a != 'any' && a != 'never' && a != 'unknown')))
  await log.debug(`最终筛选出 ${最终结果.length} 个接口类型`)

  var 最终代码 = [`export type InterfaceType = [${最终结果.join(',')}]`, ...附加代码]

  await log.debug('最终代码生成完成')

  var 输出文件夹 = path.dirname(输出文件路径)
  if (!fs.existsSync(输出文件夹)) fs.mkdirSync(输出文件夹, { recursive: true })
  fs.writeFileSync(输出文件路径, 最终代码.join('\n'))

  await log.debug(`输出文件写入完成: ${输出文件路径}`)
}
