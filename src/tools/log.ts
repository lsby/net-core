import debugGen from 'debug'

export class Log {
  private D: debugGen.Debugger
  private _info: debugGen.Debugger
  private _debug: debugGen.Debugger
  private _err: debugGen.Debugger

  constructor(private fileName: string) {
    this.D = debugGen(fileName)
    this._info = this.D.extend('info')
    this._debug = this.D.extend('debug')
    this._err = this.D.extend('err')
  }

  extend(name: string): Log {
    return new Log(`${this.fileName}:${name}`)
  }

  info(formatter: unknown, ...args: unknown[]): void {
    this._info(formatter, ...args)
  }

  debug(formatter: unknown, ...args: unknown[]): void {
    this._debug(formatter, ...args)
  }

  err(formatter: unknown, ...args: unknown[]): void {
    this._err(formatter, ...args)
  }
}
