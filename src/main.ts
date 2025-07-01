import type { HaluaLogger } from "./types"
import type { Handler, Log } from "./handlers/types"
import { Level } from "./handlers/types"

interface HaluaOptions {
  minLevel?: Level
}

export class Halua implements HaluaLogger {
  constructor(
    private handler: Handler,
    private options: HaluaOptions = {},
  ) {}

  public New(handler = this.handler, options = this.options): HaluaLogger {
    return new Halua(handler, options)
  }

  // public With() {}

  public debug(message: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Debug)) {
      this.sendToHandler("debug", true, message, ...args)
    }
  }

  public info(message: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Info)) {
      this.sendToHandler("info", true, message, ...args)
    }
  }

  public warn(message: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Warn)) {
      this.sendToHandler("warn", true, message, ...args)
    }
  }

  public error(message: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Error)) {
      this.sendToHandler("error", true, message, ...args)
    }
  }

  public assert(condition: boolean, message: string, ...args: any[]) {
    if (this.canLogByMinLevelRestriction(Level.Error)) {
      this.sendToHandler("assert", condition, message, ...args)
    }
  }

  private sendToHandler(
    field: "debug" | "info" | "warn" | "error" | "assert",
    condition = true,
    message: string,
    ...args: any[]
  ) {
    let log: Log = {
      message,
      timestamp: Date.now(),
      variables: {},
      args: [],
    }
    this.parseArgs(log, args)
    if (field === "assert") {
      this.handler.assert(condition, log)
    }
    if (field !== "assert") {
      this.handler[field](log)
    }
  }

  private parseArgs(log: Log, args: any[]) {
    let currKey = ""
    for (const arg of args) {
      if (currKey) {
        log.variables[currKey] = arg
        currKey = ""
        continue
      }

      if (typeof arg === "string" && arg.trim().indexOf(" ") === -1) {
        currKey = arg
        continue
      }

      log.args!.push(arg)
    }

    if (currKey) {
      log.message += ` ${currKey}`
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
