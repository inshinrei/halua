import type { Handler, Logger, LoggerOptions } from './types'
import { Level } from './types'

export class LoggerCore implements Logger {
  private handler: Handler = self?.console || window?.console
  private dateGetter: null | (() => string | number) = null
  private readonly options: LoggerOptions = {}

  private readonly levelMapping = new Map([
    ['debug', Level.Debug],
    ['info', Level.Info],
    ['warn', Level.Warn],
    ['error', Level.Error],
  ])

  private readonly colors = new Map([
    ['magenta', '35'],
    ['red', '91'],
    ['cyan', '36'],
    ['yellow', '33'],
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

  public New(
    handler: Handler = this.handler,
    options: LoggerOptions = this.options,
  ): Logger {
    return new LoggerCore(handler, options)
  }

  public With(msg: string, ...args: any[]): Logger {
    let postfix = this.options.postfix
      ? `${this.options.postfix} ${this.composeMsgWithArgs(msg, ...args)}`
      : this.composeMsgWithArgs(msg, ...args)
    return new LoggerCore(this.handler, {
      ...this.options,
      postfix,
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
    // console.log('\x1b[32m Output with green text \x1b[0m')
    // console.log('\x1b[35m Output with magenta text \x1b[0m')
    // console.log('\x1b[34m Output with blue text \x1b[0m')
    //
    // console.log('\x1b[41m Output with red background \x1b[0m')
    // console.log('\x1b[42m Output with green background \x1b[0m')
    // console.log('\x1b[43m Output with yellow background \x1b[0m')

    // pretty AND non custom handler is used, prettyWithCustomHandlerEscapeChars [start, rear] option

    // add prettify to variables
    switch (this.options.pretty) {
      case level === Level.Debug:
        return this.shiftValue(this.prettify(level, 'cyan'), msg)
      // magenta is bad for dark theme
      case level === Level.Info:
        return this.shiftValue(this.prettify(level, 'magenta'), msg)
      case level === Level.Warn:
        return this.shiftValue(this.prettify(level, 'yellow'), msg)
      case level === Level.Error:
        return this.shiftValue(this.prettify(level, 'red'), msg)
    }

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

  private prettify(
    value: string,
    color: 'red' | 'cyan' | 'yellow' | 'magenta',
  ) {
    return `\x1b[${this.colors.get(color)}m${value}\x1b[0m`
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
