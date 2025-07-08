import { Handler, Level, Log } from "./types"

interface WebBrowserConsoleLogHandler extends Handler {
  setDateGetter: (getter: (timestamp: number) => string) => void
}

interface ConsoleLogHandlerConsole {
  debug: (...args: any[]) => void
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  assert: (c: boolean, ...args: any[]) => void
}

interface WebBrowserConsoleHandlerOptions {
  dateGetter?: (timestamp: number) => string
  pretty?: boolean
}

export function WebBrowserConsoleHandler(
  c: ConsoleLogHandlerConsole = console,
  options: WebBrowserConsoleHandlerOptions = {},
): WebBrowserConsoleLogHandler {
  return new (class WebBrowserConsoleLog implements WebBrowserConsoleLogHandler {
    private readonly colors = new Map([
      ["grey", "#BDBDBD"],
      ["green", "#7DFFA8"],
      ["blue", "#7EBCFF"],
      ["purple", "#FF7DFF"],
      ["orange", "#FFB37D"],
      ["red", "#FF7373"],
    ])

    constructor(private options: WebBrowserConsoleHandlerOptions) {}

    debug(log: Log) {
      let args = this.insertInternalEntries({ ...log, level: Level.Debug })
      c.debug(this.composeConsoleSubstitution(args), ...args)
    }

    info(log: Log) {
      let args = this.insertInternalEntries({ ...log, level: Level.Info })
      c.log(this.composeConsoleSubstitution(args), ...args)
    }

    warn(log: Log) {
      let args = this.insertInternalEntries({ ...log, level: Level.Warn })
      c.warn(this.composeConsoleSubstitution(args), ...args)
    }

    error(log: Log) {
      let args = this.insertInternalEntries({ ...log, level: Level.Error })
      c.error(this.composeConsoleSubstitution(args), ...args)
    }

    assert(cond: boolean, log: Log) {
      let args = this.insertInternalEntries({ ...log, level: Level.Error })
      c.assert(cond, this.composeConsoleSubstitution(args), ...args)
    }

    public setDateGetter(dateGetter: (timestamp: number) => string) {
      this.options.dateGetter = dateGetter
    }

    private insertInternalEntries(log: Log) {
      if (this.options.pretty) {
        let colorKey =
          log.level === Level.Debug
            ? "blue"
            : log.level === Level.Info
              ? "purple"
              : log.level === Level.Warn
                ? "orange"
                : "red"
        return [
          `${this.prepareDate(log.timestamp)} %c${log.level}`,
          `color:${this.colors.get(colorKey)};`,
          ...(log.args || []),
        ]
      }
      return [this.prepareDate(log.timestamp), ` ${log.level}`, ...(log.args || [])]
    }

    private composeConsoleSubstitution(data: Array<any>, startingVarConvertionIndex = 2): string {
      let str = ""
      if (this.options.pretty) {
        startingVarConvertionIndex = 1
      }
      for (let i = this.options.pretty ? 1 : 0; i < data.length; i++) {
        let last = i === data.length - 1
        let v = data[i]

        if (!last && i > startingVarConvertionIndex && typeof v === "string" && v.trim().indexOf(" ") === -1) {
          data[i] = `${v}=`
        }

        if (typeof v === "string") {
          str += `%s${last ? "" : " "}`
          continue
        }

        if (typeof v === "number") {
          str += `%d${last ? "" : " "}`
          continue
        }

        str += `%o${last ? "" : " "}`
      }
      return str
    }

    private prepareDate(t: number) {
      if (this.options.dateGetter) {
        return this.options.dateGetter(t)
      }
      let d = new Date(t)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    }
  })(options)
}
