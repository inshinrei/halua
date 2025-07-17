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
  /** customize date output */
  dateGetter?: (timestamp: number) => string
  /** turn prettification on, adds colors to console output */
  pretty?: boolean
  /** default: true, get browser theme with window.matchMedia */
  fetchBrowserThemeOnInstanceCreation?: boolean
  /** provide custom colors map */
  customColors?: Colors
}

type ColorKey = "grey" | "green" | "blue" | "purple" | "orange" | "red"
type Colors = Map<ColorKey, string>

export function NewWebBrowserConsoleHandler(
  c: ConsoleLogHandlerConsole = console,
  options: WebBrowserConsoleHandlerOptions = {},
): WebBrowserConsoleLogHandler {
  return new (class WebBrowserConsoleLog implements WebBrowserConsoleLogHandler {
    public skipDeepCopyWhenSendingLog = true

    private readonly colors: Colors = new Map([])
    // bg chrome #fefbff
    private readonly lightColors: Colors = new Map([
      ["grey", "#565656"],
      ["green", "#224912"],
      ["blue", "#195367"],
      ["purple", "#8A228A"],
      ["orange", "#7F3E1E"],
      ["red", "#A51818"],
    ])
    // bg chrome #27242a
    private readonly darkColors: Colors = new Map([
      ["grey", "#C9C9C9"],
      ["green", "#73CE73"],
      ["blue", "#93B9E7"],
      ["purple", "#DCA4E9"],
      ["orange", "#EEC5A8"],
      ["red", "#FC9292"],
    ])

    constructor(private options: WebBrowserConsoleHandlerOptions) {
      this.options = options || {}
      this.options.fetchBrowserThemeOnInstanceCreation ??= true

      if (!this.options.pretty) {
        return
      }

      if (this.options.fetchBrowserThemeOnInstanceCreation) {
        if (window?.matchMedia && window?.matchMedia("(prefers-color-scheme: dark)").matches) {
          this.colors = new Map(this.darkColors)
        } else {
          this.colors = new Map(this.lightColors)
        }

        delete this.options.fetchBrowserThemeOnInstanceCreation
      } else {
        this.colors = new Map(this.lightColors)
      }
    }

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
      let additionalArgs = []
      if (log.withArgs) {
        additionalArgs.push("|")
        additionalArgs.push(...log.withArgs)
        delete log.withArgs
      }
      let totalArgs = [...(log.args || []), ...additionalArgs]
      if (this.options.pretty) {
        let colorKey: ColorKey =
          log.level === Level.Debug
            ? "purple"
            : log.level === Level.Info
              ? "blue"
              : log.level === Level.Warn
                ? "orange"
                : "red"
        return [
          `${this.prepareDate(log.timestamp)} %c${log.level}%c`,
          `color:${this.options.customColors?.get(colorKey) || this.colors.get(colorKey)};`,
          `color:${this.options.customColors?.get("green") || this.colors.get("green")}`,
          ...totalArgs,
        ]
      }
      return [this.prepareDate(log.timestamp), `${log.level}`, ...totalArgs]
    }

    private composeConsoleSubstitution(data: Array<any>, startingVarConvertIndex = 2): string {
      let str = ""
      if (this.options.pretty) {
        startingVarConvertIndex = 2
      }
      for (let i = this.options.pretty ? startingVarConvertIndex : 0; i < data.length; i++) {
        let last = i === data.length - 1
        let v = data[i]

        let vWithEqualSign = typeof v === "string" && this.stringMatchesVar(v)
        let nextVWithEqualSign = !last && typeof data[i + 1] === "string" && this.stringMatchesVar(data[i + 1])

        if (nextVWithEqualSign) {
          startingVarConvertIndex = Math.max(startingVarConvertIndex, i)
        }

        if (!last && i > startingVarConvertIndex && vWithEqualSign) {
          data[i] = `${v} =`
        }

        if (typeof v === "string") {
          // remove spaces they are not needed
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

    private prepareDate(t: number | string) {
      if (this.options.dateGetter) {
        return this.options.dateGetter(t as number)
      }
      let d = new Date(t)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    }

    private stringMatchesVar(str: string): boolean {
      return str !== "|" && str.trim().indexOf(" ") === -1
    }
  })(options)
}
