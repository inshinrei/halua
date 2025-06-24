import type { Handler, Logger, LoggerOptions } from './types'
import { Level } from './types'

export class LoggerCore implements Logger {
  private handler: Handler = self.console
  private dateGetter: null | (() => string | number) = null
  private readonly options: LoggerOptions = {}

  private readonly levelMapping = new Map([
    ['debug', Level.Debug],
    ['info', Level.Info],
    ['warn', Level.Warn],
    ['error', Level.Error],
  ])

  constructor(
    handler?: Handler | null | undefined,
    options: LoggerOptions = {},
  ) {
    if (handler) {
      this.handler = handler
    }

    if (options.dateGetter) {
      this.dateGetter = options.dateGetter
      delete options.dateGetter
    }

    this.options = {
      ...this.options,
      ...options,
    }

    // throw error if handler is not full
  }

  public New(handler: Handler, options?: LoggerOptions): Logger {
    return new LoggerCore(handler, options)
  }

  public With(msg: string, ...args: any[]): Logger {
    let postfix = this.options.postfix
      ? `${this.options.postfix} ${this.composeMsgWithArgs(msg, ...args)}`
      : this.composeMsgWithArgs(msg, ...args)
    return new LoggerCore(this.handler, {
      postfix,
      dateGetter: this.dateGetter,
    })
  }

  public debug(msg: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Debug)) {
      this.log('debug', msg, ...args)
    }
  }

  public info(msg: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Info)) {
      this.log('info', msg, ...args)
    }
  }

  public warn(msg: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Warn)) {
      this.log('warn', msg, ...args)
    }
  }

  public err(msg: string, ...args: any[]) {
    this.log('error', msg, ...args)
  }

  public assert(value: boolean, msg: string, ...args: any[]) {
    if (!value) {
      this.log('error', `assertion failed: ${msg}`, ...args)
    }
  }

  public setHandler(handler: Handler) {
    this.handler = handler
  }

  public setDateGetter(getter: () => string | number): void {
    this.dateGetter = getter
  }

  private log(
    to: 'debug' | 'info' | 'warn' | 'error',
    msg: string,
    ...args: any[]
  ): void {
    let value = msg
    value = this.composeMsgWithArgs(value, ...args)
    if (this.options.postfix) {
      value = this.appendValue(this.options.postfix, value)
    }

    let level: string = this.levelMapping.get(to)!

    value = this.formatWithDate(this.formatWithLevel(level, value))
    this.handler[to](value)
  }

  private composeMsgWithArgs(msg: string, ...args: any[]) {
    if (args.length === 1) {
      return this.appendValue(args[0], msg)
    }

    let totalMsg = msg
    let key = ''

    for (let arg of args) {
      if (!key) {
        key = arg
        continue
      }

      totalMsg = this.appendValue(`${key}="${arg}"`, totalMsg)
      key = ''
    }

    if (key) {
      totalMsg = this.appendValue(`${key}=${undefined}`, totalMsg)
    }

    return totalMsg
  }

  private formatWithLevel(level: string, msg: string): string {
    return this.shiftValue(level, msg)
  }

  private formatWithDate(msg: string): string {
    if (this.dateGetter) {
      try {
        return this.shiftValue(this.dateGetter().toString(), msg)
      } catch (_) {
        this.err('date getter catches an error, check your date getter func')
      }
    }
    return this.shiftValue(this.getDateInLocaleString(), msg)
  }

  private shiftValue(value: string, to: string) {
    return `${value} ${to}`
  }

  private appendValue(value: string, to: string) {
    return `${to} ${value}`
  }

  private getDateInLocaleString(): string {
    let d = new Date()
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  }

  private canLogByMinLevelRestriction(level: Level): boolean {
    const { minLevel } = this.options
    if (!minLevel || level === Level.Error) {
      return true
    }

    if (level === Level.Warn) {
      return minLevel !== Level.Error
    }

    if (level === Level.Info) {
      return minLevel !== Level.Warn && minLevel !== Level.Error
    }

    if (level === Level.Debug) {
      return minLevel === Level.Debug
    }

    return true
  }
}
