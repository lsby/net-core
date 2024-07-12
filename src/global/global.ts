import { Log } from '../tools/log'
import { Package } from '../tools/package'

export class GlobalPackage {
  private static instance: Package | null = null
  public static getInstance(): Package {
    if (!GlobalPackage.instance) GlobalPackage.instance = new Package()
    return GlobalPackage.instance
  }

  private constructor() {}
}

export class GlobalLog {
  private static instance: Log | null = null
  public static async getInstance(): Promise<Log> {
    return GlobalPackage.getInstance()
      .getName()
      .then((name) => {
        name = name.replaceAll('/', ':')
        if (!GlobalLog.instance) GlobalLog.instance = new Log(name)
        return GlobalLog.instance
      })
  }

  private constructor() {}
}
