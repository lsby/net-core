import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Task } from '@lsby/ts-fp-data'

export class GetProName {
  private proName: string | null = null

  getProName(): Task<string> {
    if (this.proName != null) return Task.pure(this.proName)
    return new Task(async () => {
      var jsonStr = readFileSync(resolve(import.meta.dirname || __dirname, '../../package.json'), 'utf-8')
      var json = JSON.parse(jsonStr)
      var name = json.name
      if (name == null) throw new Error('无法读取package.json中的name字段')
      this.proName = name
      return name
    })
  }
}
