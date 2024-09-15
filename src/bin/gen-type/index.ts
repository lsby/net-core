import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { Log } from '@lsby/ts-log'
import { 附加代码 } from './addition'

function 提取变量节点(源文件: ts.SourceFile): ts.VariableDeclaration[] {
  const 变量节点数组: ts.VariableDeclaration[] = []

  const 访问节点 = (节点: ts.Node): void => {
    if (ts.isVariableStatement(节点)) {
      节点.declarationList.declarations.forEach((变量声明) => {
        if (ts.isVariableDeclaration(变量声明)) {
          变量节点数组.push(变量声明)
        }
      })
    }
    ts.forEachChild(节点, 访问节点)
  }

  ts.forEachChild(源文件, 访问节点)
  return 变量节点数组
}
function 替换非法字符(字符串: string): string {
  return '_' + 字符串.replace(/[ !\-!@#$%^&*()\[\]{}\\|;:'",.\/?]/g, '_')
}

type 变量节点信息 = {
  文件: ts.SourceFile
  变量节点: ts.VariableDeclaration
  计算节点名称: string
}

export async function main(tsconfig路径: string, 目标路径: string, 输出文件路径: string): Promise<void> {
  var log = new Log('@lsby:net-core').extend('gen-type')

  await log.debug('开始生成类型...')
  await log.debug(`tsconfig路径: ${tsconfig路径}`)
  await log.debug(`目标路径: ${目标路径}`)
  await log.debug(`输出文件路径: ${输出文件路径}`)

  const tsconfig内容 = ts.parseConfigFileTextToJson(tsconfig路径, fs.readFileSync(tsconfig路径, 'utf8'))
  if (tsconfig内容.error) {
    await log.err('无法解析 tsconfig.json')
    throw new Error('无法解析 tsconfig.json')
  }
  const 解析后的tsconfig = ts.parseJsonConfigFileContent(tsconfig内容.config, ts.sys, path.resolve(tsconfig路径, '..'))
  await log.debug('成功解析 tsconfig 文件...')

  const 项目主机 = ts.createCompilerHost(解析后的tsconfig.options)
  const 项目 = ts.createProgram(解析后的tsconfig.fileNames, 解析后的tsconfig.options, 项目主机)
  await log.debug('成功读取项目...')

  var 所有源文件 = 项目.getSourceFiles()
  var 所有相关源文件们 = 所有源文件.filter((源文件) => {
    var 源文件路径 = path.normalize(源文件.fileName)
    return 源文件路径.includes(目标路径)
  })
  await log.debug(`筛选出 ${所有相关源文件们.length} 个相关源文件`)

  const 相关变量节点们: 变量节点信息[] = 所有相关源文件们.flatMap((a) =>
    提取变量节点(a).map((x) => ({
      文件: a,
      变量节点: x,
      计算节点名称: 替换非法字符(randomUUID()),
    })),
  )
  await log.debug(`提取到 ${相关变量节点们.length} 个变量节点`)

  var 伴随的虚拟文件们 = 相关变量节点们.map((a) => {
    var 代码: string[] = []
    if (a.变量节点.name.kind != ts.SyntaxKind.Identifier) {
      代码 = []
    } else {
      var 变量名称 = a.变量节点.name.text
      var netcore引入 = a.计算节点名称 + 'netcore'
      var zod引入 = a.计算节点名称 + 'zod'
      代码 = [
        a.文件.getFullText(),
        `import * as ${netcore引入} from '@lsby/net-core'`,
        `import { z as ${zod引入} } from 'zod'`,
        `
        type ${a.计算节点名称} =
          typeof ${变量名称} extends ${netcore引入}.接口类型<infer Path, infer Method, infer PreApis, infer SuccessSchema, infer ErrorSchema>
            ? Path extends string
              ? {
                  path: Path
                  method: Method
                  input: ${netcore引入}.合并JSON插件结果<PreApis>
                  successOutput: ${zod引入}.infer<SuccessSchema>
                  errorOutput: ${zod引入}.infer<ErrorSchema>
                }
              : never
            : never
        `,
      ]
    }
    return {
      ...a,
      文件: ts.createSourceFile(
        a.文件.fileName.replaceAll('.ts', '-' + randomUUID() + '.ts'),
        代码.join('\n'),
        ts.ScriptTarget.Latest,
      ),
    }
  })

  const 新项目 = ts.createProgram({
    rootNames: [...项目.getSourceFiles().map((a) => a.fileName), ...伴随的虚拟文件们.map((a) => a.文件.fileName)],
    options: 解析后的tsconfig.options,
    host: {
      ...项目主机,
      getSourceFile: (filename) => {
        const 找到的虚拟文件 = 伴随的虚拟文件们.find((a) => a.文件.fileName == filename)?.文件
        if (找到的虚拟文件 != null) return 找到的虚拟文件
        return 项目.getSourceFile(filename)
      },
    },
    oldProgram: 项目,
  })

  var 类型检查器 = 新项目.getTypeChecker()

  var 检查结果: string[] = []
  for (var 源文件 of 伴随的虚拟文件们) {
    var 结果 = ''
    ts.forEachChild(源文件.文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === 源文件.计算节点名称) {
        const type = 类型检查器.getTypeAtLocation(node)
        var 文本结果 = 类型检查器.typeToString(type)
        结果 = 文本结果
      }
    })
    检查结果.push(结果)
  }

  var 最终结果 = Array.from(new Set(检查结果.filter((a) => a != 'any' && a != 'never' && a != 'unknown')))
  await log.debug(`最终筛选出 ${最终结果.length} 个接口类型`)

  var 最终代码 = [`export type InterfaceType = [${最终结果.join(',')}]`, ...附加代码]

  var 输出文件夹 = path.dirname(输出文件路径)
  if (!fs.existsSync(输出文件夹)) fs.mkdirSync(输出文件夹, { recursive: true })
  fs.writeFileSync(输出文件路径, 最终代码.join('\n'))

  await log.debug(`输出文件写入完成: ${输出文件路径}`)
}
