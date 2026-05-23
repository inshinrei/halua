import type { BaseDispatcherOptions, ConsoleLike, DispatcherExecuteMeta } from "./DispatcherTypes"
import { DispatcherBase } from "./DispatcherBase"
import { redact } from "../format"

interface ConsoleDispatcherOptions extends Omit<BaseDispatcherOptions, "spacing"> {}

const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null

const ANSI = {
  purple: "\u001b[35m",
  blue: "\u001b[34m",
  orange: "\u001b[38;5;208m",
  red: "\u001b[31m",
  reset: "\u001b[0m",
}

const CSS = {
  purple: "color:#a855f7;font-weight:bold",
  blue: "color:#3b82f6;font-weight:bold",
  orange: "color:#f97316;font-weight:bold",
  red: "color:#ef4444;font-weight:bold",
}

const getColorForLevel = (level: string): "purple" | "blue" | "orange" | "red" => {
  let l = level.toUpperCase()
  if (l.startsWith("TRACE") || l.startsWith("DEBUG")) {
    return "purple"
  }
  if (l.startsWith("INFO")) {
    return "blue"
  }
  if (l.startsWith("NOTICE")) {
    return "orange"
  }
  if (l.startsWith("WARN") || l.startsWith("ERROR") || l.startsWith("FATAL")) {
    return "red"
  }
  return "blue"
}

export function NewConsoleColoredDispatcher(console: ConsoleLike, options?: ConsoleDispatcherOptions) {
  return () =>
    new (class ConsoleColoredDispatcher extends DispatcherBase {
      constructor(readonly console: ConsoleLike, options: ConsoleDispatcherOptions = {}) {
        super(() => {}, options)
      }

      public dispatch(meta: DispatcherExecuteMeta, rawArgs: any[], errorMeta?: Record<string, any>): void {
        let effectiveRe = this.redactDataRegExp || (meta as any).redactDataRegExp
        let processedRawArgs = effectiveRe ? rawArgs.map((v: any) => redact(v, effectiveRe)) : rawArgs
        let processedErrorMeta = errorMeta
        if (effectiveRe && errorMeta != null) {
          processedErrorMeta = redact(errorMeta, effectiveRe) as Record<string, any>
        }

        let colorKey = getColorForLevel(meta.level)

        if (isNode) {
          let args: any[] = []

          if (this.printTimestamp) {
            args.push(`${this.formatTimestamp(meta.timestamp)}`)
          }

          if (this.printLevel) {
            let margin = this.printTimestamp ? " " : ""
            let c = ANSI[colorKey]
            let r = ANSI.reset
            args.push(`${margin}${c}${meta.level}${r}`)
          }

          for (let value of processedRawArgs) {
            let formatted: any
            if (typeof this.formatArg === "function") {
              formatted = this.formatArg(value)
            } else {
              formatted = value
            }
            args.push(formatted)
          }

          if (processedErrorMeta !== undefined) {
            let m = typeof this.formatArg === "function" ? this.formatArg(processedErrorMeta) : processedErrorMeta
            args.push(m)
          }

          this._routeToConsole(meta.level, args)
          return
        }

        // web / browser path: use %c CSS styling in format string
        let cargs: any[]
        if (!this.printTimestamp && !this.printLevel) {
          cargs = []
        } else {
          let formatStr = ""
          let styleArgs: any[] = []
          if (this.printTimestamp) {
            formatStr += "%s"
            styleArgs.push(`${this.formatTimestamp(meta.timestamp)}`)
          }
          if (this.printLevel) {
            let css = CSS[colorKey]
            if (formatStr) {
              formatStr += " "
            }
            formatStr += "%c%s%c"
            styleArgs.push(css, meta.level, "")
          }
          cargs = [formatStr, ...styleArgs]
        }

        for (let value of processedRawArgs) {
          let formatted: any
          if (typeof this.formatArg === "function") {
            formatted = this.formatArg(value)
          } else {
            formatted = value
          }
          cargs.push(formatted)
        }

        if (processedErrorMeta !== undefined) {
          let m = typeof this.formatArg === "function" ? this.formatArg(processedErrorMeta) : processedErrorMeta
          cargs.push(m)
        }

        this._routeToConsole(meta.level, cargs)
      }

      _routeToConsole(level: string, args: any[]): void {
        let ul = level.toUpperCase()
        if (ul.startsWith("DEBUG")) {
          this.console.debug(...args)
          return
        }
        if (ul.startsWith("WARN")) {
          this.console.warn(...args)
          return
        }
        if (ul.startsWith("ERROR") || ul.startsWith("FATAL")) {
          this.console.error(...args)
          return
        }
        this.console.info(...args)
      }
    })(console, options)
}
