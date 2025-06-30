import type { HaluaLogger } from "./types"
import type { Handler, Log } from "./handlers/types"

export class Halua implements HaluaLogger {
  constructor(private handler: Handler) {}

  public New(handler = this.handler) {
    return new Halua(handler)
  }

  public With() {}

  public debug(message: string, ...args: any[]) {
    this.sendToHandler("debug", true, message, ...args)
  }

  public info(message: string, ...args: any[]) {
    this.sendToHandler("info", true, message, ...args)
  }

  public warn(message: string, ...args: any[]) {
    this.sendToHandler("warn", true, message, ...args)
  }

  public error(message: string, ...args: any[]) {
    this.sendToHandler("error", true, message, ...args)
  }

  public assert(condition: boolean, message: string, ...args: any[]) {
    this.sendToHandler("assert", condition, message, ...args)
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
    let vars: Record<string, any> = {}
    let currKey = ""
    let key = 0
    for (const arg of args) {
      if (currKey) {
        vars[currKey] = arg
        currKey = ""
        continue
      }

      if (typeof arg === "string" && arg.trim().indexOf(" ") === -1) {
        currKey = arg
        continue
      }

      log.message += ` ${arg}`
    }

    if (currKey) {
      log.message += ` ${currKey}`
    }

    return vars
  }
}
