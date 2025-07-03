import type { HaluaLogger, HaluaOptions } from "./types"
import type { Handler, Log } from "./handlers/types"
import { Level } from "./handlers/types"

export class Halua implements HaluaLogger {
  constructor(
    private handler: Handler,
    private options: HaluaOptions = {},
  ) {}

  public New(arg1: Handler | HaluaOptions = this.handler, arg2: HaluaOptions | undefined = this.options): HaluaLogger {
    if (
      arg1.hasOwnProperty("debug") &&
      arg1.hasOwnProperty("info") &&
      arg1.hasOwnProperty("warn") &&
      arg1.hasOwnProperty("error") &&
      arg1.hasOwnProperty("assert") &&
      arg1.hasOwnProperty("New") &&
      arg1.hasOwnProperty("With")
    ) {
      return new Halua(arg1 as Handler, arg2)
    }
    if (Object.keys(arg1).length) {
      return new Halua(this.handler, arg1 as HaluaOptions)
    }
    return new Halua(arg1 as Handler, arg2)
  }

  public With(...args: any[]): HaluaLogger {
    return new Halua(this.handler, { ...this.options, postArgs: (this.options.postArgs || []).concat(args) })
  }

  public setHandler(handler: Handler) {
    this.handler = handler
  }

  public debug(...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Debug)) {
      this.sendToHandler("debug", true, ...args)
    }
  }

  public info(...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Info)) {
      this.sendToHandler("info", true, ...args)
    }
  }

  public warn(...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Warn)) {
      this.sendToHandler("warn", true, ...args)
    }
  }

  public error(...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Error)) {
      this.sendToHandler("error", true, ...args)
    }
  }

  public assert(assertion: boolean, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Error)) {
      this.sendToHandler("assert", assertion, ...args)
    }
  }

  private sendToHandler(field: "debug" | "info" | "warn" | "error" | "assert", condition = true, ...args: any[]) {
    let log: Log = {
      timestamp: Date.now(),
      args: args || [],
    }
    if (this.options.postArgs) {
      log.args = log.args!.concat(this.options.postArgs)
    }
    if (field === "assert") {
      this.handler.assert(condition, log)
    }
    if (field !== "assert") {
      this.handler[field](log)
    }
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
