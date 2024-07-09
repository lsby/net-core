import { Task } from '@lsby/ts-fp-data'
import { GetProName } from '../tools/get-pro-name'
import { Log } from '../tools/log'

export class GlobalLog {
  private static instance: Log
  public static getInstance(): Task<Log> {
    return GlobalGetProName.getInstance()
      .getProName()
      .map((标识符) => {
        标识符 = 标识符.replaceAll('/', ':')
        if (!GlobalLog.instance) GlobalLog.instance = new Log(标识符)
        return GlobalLog.instance
      })
  }

  private constructor() {}
}

export class GlobalGetProName {
  private static instance: GetProName
  public static getInstance(): GetProName {
    if (!GlobalGetProName.instance) GlobalGetProName.instance = new GetProName()
    return GlobalGetProName.instance
  }

  private constructor() {}
}
