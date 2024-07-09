import debugGen from 'debug'
import { Task } from '@lsby/ts-fp-data'

export class Log {
  private debugObj: debugGen.Debugger
  private _info: debugGen.Debugger
  private _debug: debugGen.Debugger
  private _err: debugGen.Debugger

  constructor(private fileName: string) {
    this.debugObj = debugGen(fileName)
    this._info = this.debugObj.extend('info')
    this._debug = this.debugObj.extend('debug')
    this._err = this.debugObj.extend('err')
  }

  extend(name: string): Log {
    return new Log(`${this.fileName}:${name}`)
  }

  info(formatter: unknown, ...args: unknown[]): Task<void> {
    return new Task(async () => {
      this._info(formatter, ...args)
    })
  }

  debug(formatter: unknown, ...args: unknown[]): Task<void> {
    return new Task(async () => {
      this._debug(formatter, ...args)
    })
  }

  err(formatter: unknown, ...args: unknown[]): Task<void> {
    return new Task(async () => {
      this._err(formatter, ...args)
    })
  }
}
