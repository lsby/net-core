import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import L from 'lodash'
import ts from 'typescript'
import { Log } from '@lsby/ts-log'

function 提取顶级导出类节点(源文件: ts.SourceFile): ts.ClassDeclaration[] {
  const 类节点数组: ts.ClassDeclaration[] = []
  const visit = (节点: ts.Node): void => {
    if (
      ts.isClassDeclaration(节点) &&
      ts.getModifiers(节点)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      类节点数组.push(节点)
    }
    ts.forEachChild(节点, visit)
  }
  ts.forEachChild(源文件, visit)
  return 类节点数组
}
function 替换非法字符(字符串: string): string {
  return '_' + 字符串.replace(/[ !\-!@#$%^&*()\[\]{}\\|;:'",.\/?]/g, '_')
}

type 类节点信息 = {
  文件: ts.SourceFile
  类节点: ts.ClassDeclaration
}
function 计算完整名称(tsconfig路径: string, a: 类节点信息): string {
  return 替换非法字符(path.relative(path.dirname(tsconfig路径), a.文件.fileName) + '_' + a.类节点.name?.text)
}
function 计算引入路径(输出文件路径: string, a: 类节点信息): string {
  return path.relative(path.dirname(输出文件路径), a['文件'].fileName).replaceAll('\\', '/').replaceAll('.ts', '')
}

export async function main(
  tsconfig路径: string,
  目标路径: string,
  输出文件路径: string,
  文件过滤表达式: string,
): Promise<void> {
  var log = new Log('@lsby:net-core').extend('gen-test')

  await log.debug('开始生成测试...')
  await log.debug(`tsconfig路径: ${tsconfig路径}`)
  await log.debug(`目标路径: ${目标路径}`)
  await log.debug(`输出文件路径: ${输出文件路径}`)
  await log.debug(`文件过滤表达式: ${文件过滤表达式}`)

  const tsconfig内容 = ts.parseConfigFileTextToJson(tsconfig路径, fs.readFileSync(tsconfig路径, 'utf8'))
  if (tsconfig内容.error) {
    await log.err('无法解析 tsconfig.json', tsconfig内容.error)
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
    var 符合过滤表达式 = new RegExp(文件过滤表达式 || '.*').test(源文件路径)
    return 源文件路径.includes(目标路径) && 符合过滤表达式
  })
  await log.debug(`筛选出 ${所有相关源文件们.length} 个相关源文件`)

  const 相关类节点们: 类节点信息[] = 所有相关源文件们.flatMap((a) =>
    提取顶级导出类节点(a).map((x) => ({
      文件: a,
      类节点: x,
    })),
  )
  await log.debug(`提取到 ${相关类节点们.length} 个类节点`)

  var 伴随的虚拟文件们 = 相关类节点们.map((a) => {
    var 类名字 = a.类节点.name?.text
    var 代码 = [
      `import { 接口测试 } from '@lsby/net-core'`,
      `import {${类名字}} from "./${a.文件.fileName.split('/').at(-1)?.replaceAll('.ts', '')}"`,
      `type 计算结果 = ${类名字} extends 接口测试 ? true : false`,
    ]
    return ts.createSourceFile(
      a.文件.fileName.replaceAll('.ts', '-' + randomUUID() + '.ts'),
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

  var 检查结果: boolean[] = []
  for (var 源文件 of 伴随的虚拟文件们) {
    var 结果 = false
    ts.forEachChild(源文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '计算结果') {
        const type = 类型检查器.getTypeAtLocation(node)
        var 文本结果 = 类型检查器.typeToString(type)
        if (文本结果 == 'true') 结果 = true
      }
    })
    检查结果.push(结果)
  }

  var 最终结果 = L.zip(相关类节点们, 检查结果)
    .filter((a) => a[1] == true)
    .map((a) => a[0])
    .filter((a) => a != null)
  await log.debug(`最终筛选到 ${最终结果.length} 个测试用例`)

  var 最终代码 = [
    "import { test } from 'vitest'",
    "import './unit-test-prefix'",
    '',
    ...最终结果.map(
      (a) =>
        `import {${a.类节点.name?.text} as ${计算完整名称(tsconfig路径, a)}} from '${计算引入路径(输出文件路径, a)}'`,
    ),
    '',
    ...最终结果
      .map((a) => 计算完整名称(tsconfig路径, a))
      .map((a) => `test('${a}', async () => await new ${a}().运行())`),
    '',
  ]

  await log.debug('最终代码生成完成')

  var 输出文件夹 = path.dirname(输出文件路径)
  if (!fs.existsSync(输出文件夹)) {
    fs.mkdirSync(输出文件夹, { recursive: true })
  }
  fs.writeFileSync(输出文件路径, 最终代码.join('\n'))

  await log.debug(`输出文件写入完成: ${输出文件路径}`)
}
