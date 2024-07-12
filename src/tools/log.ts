import debugGen from 'debug'

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

  async info(formatter: unknown, ...args: unknown[]): Promise<void> {
    this._info(formatter, ...args)
  }

  async debug(formatter: unknown, ...args: unknown[]): Promise<void> {
    this._debug(formatter, ...args)
  }

  async err(formatter: unknown, ...args: unknown[]): Promise<void> {
    this._err(formatter, ...args)
  }
}
