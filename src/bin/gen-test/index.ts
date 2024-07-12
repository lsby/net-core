import fs, { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { Log } from '../../tools/log'

export async function main(
  tsconfigPath: string,
  interfaceFolderPath: string,
  outFilePath: string,
  filter: string,
): Promise<void> {
  var log = new Log('@lsby:net-core').extend('gen-test')

  const projectRootPath = path.dirname(tsconfigPath)

  const tsconfigJson = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf8'))
  if (tsconfigJson.error) {
    throw new Error('无法解析 tsconfig.json')
  }
  const parsedTsconfig = ts.parseJsonConfigFileContent(tsconfigJson.config, ts.sys, path.resolve(tsconfigPath, '..'))
  await log.debug('成功解析 tsconfig 文件...')

  const projectHost = ts.createCompilerHost(parsedTsconfig.options)
  const project = ts.createProgram(parsedTsconfig.fileNames, parsedTsconfig.options, projectHost)
  await log.debug('成功读取项目...')

  // 不可以删除, 否则会变得不幸
  const _check = project.getTypeChecker()

  const allSourceFiles = project.getSourceFiles()
  const typeSourceFiles = allSourceFiles.filter((sourceFile) => {
    // 我们约定接口类型必须名为 type.ts
    return new RegExp(`${interfaceFolderPath.replaceAll('\\', '\\\\')}.*type\.ts`).test(
      path.resolve(sourceFile.fileName),
    )
  })
  const testSourceFiles = allSourceFiles.filter((sourceFile) => {
    return new RegExp(`${interfaceFolderPath.replaceAll('\\', '\\\\')}.*\.test\.ts`).test(
      path.resolve(sourceFile.fileName),
    )
  })

  const testSourceFilesFilter = testSourceFiles.filter((sourceFile) => {
    return new RegExp(filter).test(path.resolve(sourceFile.fileName))
  })

  await log.debug(
    '找到 %o 个接口，其中有 %o 个测试，筛选后还剩 %o 个...',
    typeSourceFiles.length,
    testSourceFiles.length,
    testSourceFilesFilter.length,
  )

  const importCode: string[] = []
  const testCode: string[] = []
  for (var index = 0; index < testSourceFilesFilter.length; index++) {
    var testSourceFile = testSourceFilesFilter[index]
    if (testSourceFile == null) throw new Error('非预期的数组越界')

    const filenameRelativeToApiFolder = path
      .relative(interfaceFolderPath, testSourceFile.fileName)
      .replaceAll('\\', '/')
    const importName = filenameRelativeToApiFolder
      .replaceAll('/', '_')
      .replaceAll('.test.ts', '')
      .replaceAll('./', '')
      .replaceAll('-', '_')
    const filenameRelativeToProjectRoot = path
      .relative(projectRootPath, testSourceFile.fileName)
      .replaceAll('\\', '/')
      .replaceAll('.ts', '')
    const outputFolderRelativeToProjectRoot = path
      .relative(path.dirname(outFilePath), projectRootPath)
      .replaceAll('\\', '/')
    const importPath = path.join(outputFolderRelativeToProjectRoot, filenameRelativeToProjectRoot).replaceAll('\\', '/')

    await log.info(`处理（${index + 1} / ${testSourceFilesFilter.length}）：${filenameRelativeToApiFolder}`)

    for (const node of testSourceFile.statements) {
      if (ts.isExportAssignment(node) && node.isExportEquals === undefined) {
        const expression = node.expression
        if (ts.isNewExpression(expression) && expression.expression.getText() === '测试') {
          break
        }
        throw new Error(`${testSourceFile.fileName}：默认导出不是 测试`)
      }
    }

    importCode.push(`import ${importName} from '${importPath}'`)
    testCode.push(generateTestCode(importName, importName))
  }

  const finalTestFile = [
    "import { test } from 'vitest'",
    "import './unit-test-prefix'",
    '',
    ...importCode,
    '',
    ...testCode,
    '',
  ].join('\n')

  var outDir = path.dirname(outFilePath)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  writeFileSync(outFilePath, finalTestFile)
}

function generateTestCode(testCaseName: string, importName: string): string {
  return `test('${testCaseName}', async () => await ${importName}.运行())`
}
