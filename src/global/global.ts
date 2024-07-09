import { Task } from '@lsby/ts-fp-data'
import { GetProName } from '../tools/get-pro-name'
import { Log } from '../tools/log'

export class GlobalLog {
  private static instance: Log
  public static getInstance(): Task<Log> {
    return GlobalGetProName.getInstance()
      .getProName()
      .map((name) => {
        name = name.replaceAll('/', ':')
        if (!GlobalLog.instance) GlobalLog.instance = new Log(name)
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
