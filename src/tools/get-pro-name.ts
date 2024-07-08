import { readFileSync } from 'fs'
import { resolve } from 'path'

export class GetProName {
  private proName: string | null = null

  getProName(): string {
    if (this.proName != null) return this.proName
    var jsonStr = readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
    var json = JSON.parse(jsonStr)
    var name = json.name
    if (name == null) throw new Error('无法读取package.json中的name字段')
    this.proName = name
    return name
  }
}
