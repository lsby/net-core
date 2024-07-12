import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

export class Package {
  private packageJSON: Record<string, any> | null = null

  private async findPackageJson(startPath: string): Promise<string | null> {
    var currentPath = startPath

    while (true) {
      var packageJsonPath = join(currentPath, 'package.json')
      if (existsSync(packageJsonPath)) return packageJsonPath
      var parentPath = resolve(currentPath, '..')
      if (parentPath === currentPath) break
      currentPath = parentPath
    }

    return null
  }

  private async getJSON(): Promise<Record<string, any>> {
    if (this.packageJSON != null) return this.packageJSON
    var packagePath = await this.findPackageJson(import.meta.dirname || __dirname)
    if (packagePath == null) throw new Error('无法读取找到package.json文件')
    var jsonStr = readFileSync(packagePath, 'utf-8')
    var json = JSON.parse(jsonStr)
    this.packageJSON = json
    return json
  }

  async getName(): Promise<string> {
    var json = await this.getJSON()
    var name = json['name']
    if (name == null) throw new Error('无法读取package.json中的name字段')
    return name
  }
}
