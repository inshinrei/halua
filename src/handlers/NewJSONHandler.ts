import { Handler, Level, Log } from "./types"

interface JSONLogHandler extends Handler {
  setDateGetter: (getter: (timestamp: number) => string) => void
}

interface JSONLogHandlerOptions {
  /** change timestamp output */
  dateGetter?: (timestamp: number) => string
  /** replace value during stringify, return null to fallback on JSONHandler replacer */
  replacer?: (value: any) => any
  linkedArgumentsFlatten?: boolean
}

export function NewJSONHandler(send: (data: string) => void, options: JSONLogHandlerOptions = {}): JSONLogHandler {
  return new (class JSONLog implements JSONLogHandler {
    private readonly takenNames = new Set(["timestamp", "level", "args"])

    constructor(private options: JSONLogHandlerOptions) {
      this.options = options || {}
    }

    debug(log: Log) {
      this.log({ ...log, level: Level.Debug })
    }

    info(log: Log) {
      this.log({ ...log, level: Level.Info })
    }

    warn(log: Log) {
      this.log({ ...log, level: Level.Warn })
    }

    error(log: Log) {
      this.log({ ...log, level: Level.Error })
    }

    assert(c: boolean, log: Log) {
      if (!c) {
        this.log({ ...log, level: Level.Error })
      }
    }

    public setDateGetter(getter: (timestamp: number) => string) {
      this.options.dateGetter = getter
    }

    private log(log: Log) {
      try {
        log.timestamp = this.formatDate(log.timestamp as number)
        send(JSON.stringify(this.flattenLinkedArguments(log), this.replacer))
      } catch (err) {
        if (log.level !== Level.Error) {
          this.error({
            args: [`err while trying to stringify JSON ${err}`],
            timestamp: log.timestamp,
          })
        }
      }
    }

    private formatDate(timestamp: number) {
      if (this.options?.dateGetter) {
        return this.options.dateGetter(timestamp)
      }
      return new Date(timestamp).toISOString()
    }

    private flattenLinkedArguments(log: Log): Record<string, any> {
      if (this.options?.linkedArgumentsFlatten !== undefined && this.options?.linkedArgumentsFlatten === false) {
        return log
      }
      if (log.withArgs) {
        this.composeLogWithArgsFlattened(log)
        delete log.withArgs
      }
      return log
    }

    private composeLogWithArgsFlattened(log: Log) {
      let composedLog: Record<string, any> = log
      let name = ""
      for (let arg of log.withArgs!) {
        if (typeof arg === "string" && this.stringMatchesVar(arg)) {
          name = arg
          continue
        }
        if (name && !this.takenNames.has(name)) {
          composedLog[name] = arg
          name = ""
          continue
        }
        console.debug("we are pushing", arg)
        log.args?.push(arg)
      }
      return log
    }

    private stringMatchesVar(str: string): boolean {
      return str.trim().indexOf(" ") === -1
    }

    private replacer(_: string, value: any) {
      if (this.options?.replacer) {
        let v = this.options.replacer(value)
        if (v !== null) {
          return v
        }
      }
      if (typeof value === "symbol") {
        return value.toString()
      }
      if (value instanceof Set) {
        return Array.from(value)
      }
      if (value instanceof Map) {
        let obj: Record<string, any> = {}
        for (let key of value.keys()) {
          obj[key] = value.get(key)
        }
        return obj
      }
      return value
    }
  })(options)
}
