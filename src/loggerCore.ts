import type { Handler, Log, Logger, LoggerOptions } from "./types"
import { Level } from "./types"
import { HandlerJSON } from "./JSONHandler"

export class LoggerCore implements Logger {
  private handler: Handler = console || self?.console || window?.console
  private dateGetter: null | (() => string | number) = null
  private readonly options: LoggerOptions = {}

  private readonly levelMapping: Map<string, Level> = new Map([
    ["debug", Level.Debug],
    ["info", Level.Info],
    ["warn", Level.Warn],
    ["error", Level.Error],
  ])

  private readonly colors = new Map([
    ["magenta", "35"],
    ["red", "91"],
    ["cyan", "36"],
    ["yellow", "33"],
  ])

  constructor(handler?: Handler | null | undefined, options: LoggerOptions = {}) {
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

  // handler is passed by ref
  public New(handler: Handler | null = this.handler, options: LoggerOptions = this.options): Logger {
    return new LoggerCore(handler, { ...options })
  }

  public With(msg: string, ...args: any[]): Logger {
    let postfix = this.options.postfix
      ? `${this.options.postfix} ${this.composeMsgWithArgs(msg, ...args)}`
      : this.composeMsgWithArgs(msg, ...args)
    // handler is passed by ref here
    // check how With works with variables (should store them on a new line, guess vars should be also moved to options)
    return new LoggerCore(this.handler, {
      ...this.options,
      postfix,
    })
  }

  public debug(msg: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Debug)) {
      this.log("debug", msg, ...args)
    }
  }

  public info(msg: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Info)) {
      this.log("info", msg, ...args)
    }
  }

  public warn(msg: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Warn)) {
      this.log("warn", msg, ...args)
    }
  }

  public err(msg: string, ...args: any[]) {
    this.log("error", msg, ...args)
  }

  public assert(value: boolean, msg: string, ...args: any[]) {
    if (!value) {
      this.log("error", `assertion failed: ${msg}`, ...args)
    }
  }

  public setHandler(handler: Handler) {
    this.handler = handler
  }

  public setDateGetter(getter: () => string | number): void {
    this.dateGetter = getter
  }

  private log(to: "debug" | "info" | "warn" | "error", msg: string, ...args: any[]): void {
    let level = this.levelMapping.get(to)!

    let logStruct: Log = {
      msg,
      level,
      variables: {},
      // for JSON it should be just stamp
      timestamp: this.getTimestamp(),
    }

    this.modifyVariablesIn(logStruct, ...args)
    if (this.options.postfix) {
      logStruct.msg = this.appendValue(this.options.postfix, logStruct.msg)
    }

    try {
      if (this.handler instanceof HandlerJSON) {
        this.handler[to](logStruct.msg, logStruct.timestamp, logStruct.variables)
        return
      }

      this.handler[to](this.composeStrFrom(logStruct))
    } catch (err) {
      if (level !== Level.Error) {
        this.err(`failed to call handler for ${to}`)
      }
    }
  }

  private modifyVariablesIn(data: Log, ...args: any[]): void {
    let key = ""
    for (let arg of args) {
      if (!key) {
        if (typeof arg === "object") {
          try {
            data.msg = this.appendValue(JSON.stringify(arg), data.msg)
          } catch (_) {
            if (data.level !== Level.Error) {
              this.err(`stringify failed for, ${arg}`)
            }
          }
          continue
        }

        key = arg
        continue
      }

      data.variables[key] = arg
      // if typeof arg object need to stringify
      key = ""
    }

    if (key) {
      data.variables[key] = undefined
    }
  }

  private composeStrFrom(data: Log) {
    let variablesStr = ""

    for (let key in data.variables) {
      variablesStr += ` ${key}="${data.variables[key]}"`
      variablesStr = variablesStr.trim()
    }

    return `${data.timestamp} ${this.formatWithLevel(data.level, "")} ${data.msg}${variablesStr ? "\n" : ""}${variablesStr}`
  }

  private composeMsgWithArgs(msg: string, ...args: any[]) {
    if (args.length === 1) {
      return this.appendValue(args[0], msg)
    }

    let totalMsg = msg
    let key = ""

    for (let arg of args) {
      if (!key) {
        key = arg
        continue
      }

      totalMsg = this.appendValue(`${key}="${arg}"`, totalMsg)
      key = ""
    }

    if (key) {
      totalMsg = this.appendValue(`${key}=${undefined}`, totalMsg)
    }

    return totalMsg
  }

  private formatWithLevel(level: string, msg: string): string {
    // pretty AND non custom handler is used, prettyWithCustomHandlerEscapeChars [start, rear] option

    // add prettify to variables
    switch (this.options.pretty) {
      case level === Level.Debug:
        return this.shiftValue(this.prettify(level, "cyan"), msg)
      // magenta is bad for dark theme
      case level === Level.Info:
        return this.shiftValue(this.prettify(level, "magenta"), msg)
      case level === Level.Warn:
        return this.shiftValue(this.prettify(level, "yellow"), msg)
      case level === Level.Error:
        return this.shiftValue(this.prettify(level, "red"), msg)
    }

    return this.shiftValue(level, msg)
  }

  private getTimestamp(): string {
    if (this.dateGetter) {
      try {
        return this.dateGetter().toString()
      } catch (_) {}
    }
    return this.getDateInLocaleString()
  }

  private prettify(value: string, color: "red" | "cyan" | "yellow" | "magenta") {
    return `\x1b[${this.colors.get(color)}m${value}\x1b[0m`
  }

  private shiftValue(value: string, to: string) {
    if (!to) {
      return value
    }
    return `${value} ${to}`
  }

  private appendValue(value: string, to: string) {
    if (!to) {
      return value
    }
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
