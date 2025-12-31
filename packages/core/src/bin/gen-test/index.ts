import { Log } from '@lsby/ts-log'
import L from 'lodash'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

function 检查存在默认导出(源文件: ts.SourceFile): boolean {
  for (let statement of 源文件.statements) {
    if (ts.isExportAssignment(statement) && (statement.isExportEquals ?? null) === null) {
      return true
    }
  }
  return false
}
function 替换非法字符(字符串: string): string {
  return '_' + 字符串.replace(/[ !\-!@#$%^&*()\[\]{}\\|;:'",.\/?]/g, '_')
}

function 计算完整名称(tsconfig路径: string, a: ts.SourceFile): string {
  return 替换非法字符(path.relative(path.dirname(tsconfig路径), a.fileName))
}
function 计算引入路径(输出文件路径: string, a: ts.SourceFile): string {
  return path.relative(path.dirname(输出文件路径), a.fileName).replaceAll('\\', '/').replaceAll('.ts', '')
}

export async function main(
  tsconfig路径: string,
  目标路径: string,
  输出文件路径: string,
  文件过滤表达式: string,
): Promise<void> {
  let log = new Log('@lsby:net-core').extend('gen-test')

  await log.debug('开始生成测试...')
  await log.debug(`tsconfig路径: ${tsconfig路径}`)
  await log.debug(`目标路径: ${目标路径}`)
  await log.debug(`输出文件路径: ${输出文件路径}`)
  await log.debug(`文件过滤表达式: ${文件过滤表达式}`)

  let tsconfig内容 = ts.parseConfigFileTextToJson(tsconfig路径, fs.readFileSync(tsconfig路径, 'utf8'))
  let tsconfig内容错误 = tsconfig内容.error ?? null
  if (tsconfig内容错误 !== null) {
    await log.error('无法解析 tsconfig.json', tsconfig内容错误)
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
    let 符合过滤表达式 = new RegExp(文件过滤表达式 === '' ? '.*' : 文件过滤表达式).test(源文件路径)
    if (符合过滤表达式 === false) return false
    return true
  })
  await log.debug(`筛选出 ${相关源文件们.length} 个相关源文件`)

  let 伴随的虚拟文件们 = 相关源文件们.map((a) => {
    let 代码 = [
      `import { 接口测试 } from '@lsby/net-core'`,
      `import 导入 from "./${a.fileName.split('/').at(-1)?.replaceAll('.ts', '')}"`,
      ``,
      `type 计算结果 = typeof 导入 extends 接口测试 ? true : false`,
    ]
    return ts.createSourceFile(
      a.fileName.replaceAll('.ts', '-' + randomUUID() + '.ts'),
      代码.join('\n'),
      ts.ScriptTarget.Latest,
    )
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

  let 检查结果: boolean[] = []
  for (let 源文件 of 伴随的虚拟文件们) {
    let 结果 = false
    ts.forEachChild(源文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '计算结果') {
        let type = 类型检查器.getTypeAtLocation(node)
        let 文本结果 = 类型检查器.typeToString(type)
        if (文本结果 === 'true') 结果 = true
      }
    })
    检查结果.push(结果)
  }

  let 最终结果 = L.zip(相关源文件们, 检查结果)
    .filter((a) => a[1] === true)
    .map((a) => a[0] ?? null)
    .filter((a) => a !== null)
  await log.debug(`最终筛选出 ${最终结果.length} 个测试用例`)

  let 最终代码 = [
    `// 该文件由脚本自动生成, 请勿修改.`,
    "import { test } from 'vitest'",
    "import './unit-test-prefix'",
    '',
    ...最终结果.map((a) => `import ${计算完整名称(tsconfig路径, a)} from './${计算引入路径(输出文件路径, a)}'`),
    '',
    ...最终结果.map((a) => 计算完整名称(tsconfig路径, a)).map((a) => `test('${a}', async () => await ${a}.运行())`),
    '',
  ]

  await log.debug('最终代码生成完成')

  let 输出文件夹 = path.dirname(输出文件路径)
  if (fs.existsSync(输出文件夹) === false) fs.mkdirSync(输出文件夹, { recursive: true })
  fs.writeFileSync(输出文件路径, 最终代码.join('\n'))

  await log.debug(`输出文件写入完成: ${输出文件路径}`)
}
