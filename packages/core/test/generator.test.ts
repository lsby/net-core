import fs from 'node:fs'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { main as 生成接口列表 } from '../src/bin/gen-api-list'
import { main as 生成接口类型 } from '../src/bin/gen-api-type'
import { main as 生成测试列表 } from '../src/bin/gen-test'

let 临时目录们: string[] = []

function 创建临时工程(文件们: Record<string, string>): { 根目录: string; tsconfig路径: string } {
  let 根目录 = fs.mkdtempSync(path.join(import.meta.dirname, '.generator-'))
  临时目录们.push(根目录)

  for (let [相对路径, 内容] of Object.entries(文件们)) {
    let 文件路径 = path.join(根目录, 相对路径)
    fs.mkdirSync(path.dirname(文件路径), { recursive: true })
    fs.writeFileSync(文件路径, 内容)
  }

  let netCore入口 = path.resolve(import.meta.dirname, '../src/index.ts').replaceAll('\\', '/')
  let tsconfig路径 = path.join(根目录, 'tsconfig.json')
  fs.writeFileSync(
    tsconfig路径,
    JSON.stringify({
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        baseUrl: '.',
        paths: { '@lsby/net-core': [netCore入口] },
      },
      include: ['**/*.ts'],
    }),
  )
  return { 根目录, tsconfig路径 }
}

afterEach(() => {
  for (let 临时目录 of 临时目录们) fs.rmSync(临时目录, { recursive: true, force: true })
  临时目录们 = []
})

test('接口生成器只处理目标目录，不误收名称相近的兄弟目录', async () => {
  let 接口源码 = `
import { 常用接口返回器, 接口, 接口逻辑 } from '@lsby/net-core'
import { z } from 'zod'

export default new 接口('/inside', 'get', 接口逻辑.空逻辑(), new 常用接口返回器(z.never(), z.object({})))
`
  let 类型导出源码 = `
import { NetCoreExportType } from '@lsby/net-core'

export type SharedGeneratorType = { value: string }
type Exported = NetCoreExportType<'SharedGeneratorType', SharedGeneratorType>
export default Exported
`
  let 兄弟目录源码 = 接口源码.replace('/inside', '/outside')
  let 工程 = 创建临时工程({
    'interface/inside.ts': 接口源码,
    'interface/shared-type.ts': 类型导出源码,
    'interface-extra/outside.ts': 兄弟目录源码,
  })
  let 接口目录 = path.join(工程.根目录, 'interface')
  let 列表输出路径 = path.join(工程.根目录, 'generated/interface-list.ts')
  let 类型输出路径 = path.join(工程.根目录, 'generated/interface-type.ts')

  await 生成接口列表(工程.tsconfig路径, 接口目录, 列表输出路径)
  await 生成接口类型(工程.tsconfig路径, 接口目录, 类型输出路径)

  let 列表内容 = fs.readFileSync(列表输出路径, 'utf8')
  let 类型内容 = fs.readFileSync(类型输出路径, 'utf8')
  expect(列表内容).toContain('inside')
  expect(列表内容).not.toContain('outside')
  expect(列表内容).not.toContain('shared-type')
  expect(类型内容).toContain('"/inside"')
  expect(类型内容).not.toContain('"/outside"')
  expect(类型内容).toContain('export type SharedGeneratorType')
})

test('所有生成器在目标源码存在 TypeScript 错误时失败', async () => {
  let 工程 = 创建临时工程({ 'interface/broken.ts': `let 数字: number = '错误'\nexport default 数字\n` })
  let 接口目录 = path.join(工程.根目录, 'interface')

  await expect(生成接口列表(工程.tsconfig路径, 接口目录, path.join(工程.根目录, 'list.ts'))).rejects.toThrow(
    '存在 TypeScript 错误',
  )
  await expect(生成接口类型(工程.tsconfig路径, 接口目录, path.join(工程.根目录, 'type.ts'))).rejects.toThrow(
    '存在 TypeScript 错误',
  )
  await expect(生成测试列表(工程.tsconfig路径, 接口目录, path.join(工程.根目录, 'test.ts'))).rejects.toThrow(
    '存在 TypeScript 错误',
  )
})

test('生成器拒绝无法确定种类的 any 默认导出', async () => {
  let 工程 = 创建临时工程({ 'interface/ambiguous.ts': `let 项目: any = {}\nexport default 项目\n` })
  let 接口目录 = path.join(工程.根目录, 'interface')

  await expect(生成接口列表(工程.tsconfig路径, 接口目录, path.join(工程.根目录, 'list.ts'))).rejects.toThrow(
    '推导结果不明确',
  )
  await expect(生成接口类型(工程.tsconfig路径, 接口目录, path.join(工程.根目录, 'type.ts'))).rejects.toThrow(
    '推导结果不明确',
  )
  await expect(生成测试列表(工程.tsconfig路径, 接口目录, path.join(工程.根目录, 'test.ts'))).rejects.toThrow(
    '推导结果不明确',
  )
})
