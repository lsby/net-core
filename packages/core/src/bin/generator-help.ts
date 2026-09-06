import path from 'node:path'
import ts from 'typescript'

export function 路径位于目录内(目录路径: string, 文件路径: string): boolean {
  let 相对路径 = path.relative(path.resolve(目录路径), path.resolve(文件路径))
  return (
    相对路径 !== '' &&
    相对路径 !== '..' &&
    相对路径.startsWith(`..${path.sep}`) === false &&
    path.isAbsolute(相对路径) === false
  )
}

export function 路径相同(左路径: string, 右路径: string): boolean {
  let 左规范路径 = path.resolve(左路径)
  let 右规范路径 = path.resolve(右路径)
  if (process.platform === 'win32') return 左规范路径.toLowerCase() === 右规范路径.toLowerCase()
  return 左规范路径 === 右规范路径
}

export function 检查TypeScript诊断(项目: ts.Program, 源文件们: readonly ts.SourceFile[], 阶段: string): void {
  let 诊断们: ts.Diagnostic[] = [
    ...项目.getConfigFileParsingDiagnostics(),
    ...项目.getOptionsDiagnostics(),
    ...项目.getGlobalDiagnostics(),
  ]
  for (let 源文件 of 源文件们) {
    诊断们.push(...项目.getSyntacticDiagnostics(源文件), ...项目.getSemanticDiagnostics(源文件))
  }
  if (诊断们.length === 0) return

  let 格式化主机: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: (文件名) => 文件名,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }
  throw new Error(`${阶段}存在 TypeScript 错误:\n${ts.formatDiagnostics(诊断们, 格式化主机)}`)
}
