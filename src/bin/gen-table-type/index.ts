import { Log } from '@lsby/ts-log'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { 附加代码 } from './addition'

function 检查存在默认导出(源文件: ts.SourceFile): boolean {
  let 存在默认导出 = false

  ts.forEachChild(源文件, (节点) => {
    if (ts.isExportDeclaration(节点)) {
      let 节点导出 = 节点.exportClause ?? null
      // 判断是否是 class 的默认导出
      if ((节点导出 !== null && ts.isDefaultClause(节点导出)) || ts.isExportAssignment(节点)) {
        存在默认导出 = true
      }
    } else if (
      ts.isClassDeclaration(节点) &&
      (节点.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.DefaultKeyword) ?? false) // 直接判断是否是默认导出的类
    ) {
      存在默认导出 = true
    }
  })

  return 存在默认导出
}

export async function main(tsconfig路径: string, 目标路径: string, 输出文件路径: string): Promise<void> {
  let log = new Log('@lsby:net-core').extend('gen-table-type')

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
      import { 分页选项, 排序选项, 条件组, 翻译列描述, 虚拟表 } from '@lsby/net-core'
      import { z } from 'zod'
      import 导入 from "./${a.fileName.split('/').at(-1)?.replaceAll('.ts', '')}",

      // 路径
      type 路径 = (typeof 导入)['资源路径']

      // 列
      type 列描述Zod = 导入 extends 虚拟表<any, infer X, any, any, any, any> ? X : never

      // 错误
      type 增错误 = 导入 extends 虚拟表<any, any, infer X, any, any, any> ? z.infer<X> : never
      type 删错误 = 导入 extends 虚拟表<any, any, any, infer X, any, any> ? z.infer<X> : never
      type 改错误 = 导入 extends 虚拟表<any, any, any, any, infer X, any> ? z.infer<X> : never
      type 查错误 = 导入 extends 虚拟表<any, any, any, any, any, infer X> ? z.infer<X> : never

      // 最终输出
      type 最终输出 = 路径 extends infer _
        ? {
            路径: 路径

            构造参数: 导入 extends 虚拟表<infer X, any, any, any, any, any> ? z.infer<X> : never
            列类型: 翻译列描述<z.infer<列描述Zod>>

            增参数_数据们: Partial<翻译列描述<z.infer<列描述Zod>>>[]
            删参数_筛选条件: 条件组<z.infer<ReturnType<列描述Zod['keyof']>>>
            改参数_新值: Partial<翻译列描述<z.infer<列描述Zod>>>
            改参数_筛选条件: 条件组<z.infer<ReturnType<列描述Zod['keyof']>>>
            查参数_筛选条件: 条件组<z.infer<ReturnType<列描述Zod['keyof']>>>
            查参数_分页条件: 分页选项
            查参数_排序条件: 排序选项<z.infer<ReturnType<列描述Zod['keyof']>>>

            增原始错误值: 增错误
            删原始错误值: 删错误
            改原始错误值: 改错误
            查原始错误值: 查错误

            增原始正确值: {}
            删原始正确值: {}
            改原始正确值: {}
            查原始正确值: 翻译列描述<z.infer<列描述Zod>>[]

            增包装结果: { status: 'fail'; data: 增错误 } | { status: 'success'; data:{} }
            删包装结果: { status: 'fail'; data: 删错误 } | { status: 'success'; data:{} }
            改包装结果: { status: 'fail'; data: 改错误 } | { status: 'success'; data:{} }
            查包装结果: { status: 'fail'; data: 改错误 } | { status: 'success'; data: 翻译列描述<z.infer<列描述Zod>>[] }
          }
        : never
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

  let 结果: string[] = []
  for (let 源文件 of 伴随的虚拟文件们) {
    ts.forEachChild(源文件, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '最终输出') {
        let type = 类型检查器.getTypeAtLocation(node)
        结果.push(
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
  }

  let 最终结果 = Array.from(new Set(结果.filter((a) => a !== 'any' && a !== 'never' && a !== 'unknown')))
  await log.debug(`最终筛选出 ${最终结果.length} 个接口表类型`)

  let 最终代码 = [`export type InterfaceTableType = [${最终结果.join(',')}]`, 附加代码]

  await log.debug('最终代码生成完成')

  let 输出文件夹 = path.dirname(输出文件路径)
  if (fs.existsSync(输出文件夹) === false) fs.mkdirSync(输出文件夹, { recursive: true })
  fs.writeFileSync(输出文件路径, 最终代码.join('\n'))

  await log.debug(`输出文件写入完成: ${输出文件路径}`)
}
