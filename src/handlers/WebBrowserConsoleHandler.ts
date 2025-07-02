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
}

export function WebBrowserConsoleHandler(
  c: ConsoleLogHandlerConsole = console,
  options: WebBrowserConsoleHandlerOptions = {},
): WebBrowserConsoleLogHandler {
  return new (class ConsoleLog implements WebBrowserConsoleLogHandler {
    constructor(private options: WebBrowserConsoleHandlerOptions) {}

    debug(log: Log) {
      let args = this.addDateAndLevel({ ...log, level: Level.Debug })
      c.debug(this.composeConsoleSubstitution(args), ...args)
    }

    info(log: Log) {
      let args = this.addDateAndLevel({ ...log, level: Level.Info })
      c.log(this.composeConsoleSubstitution(args), ...args)
    }

    warn(log: Log) {
      let args = this.addDateAndLevel({ ...log, level: Level.Warn })
      c.warn(this.composeConsoleSubstitution(args), ...args)
    }

    error(log: Log) {
      let args = this.addDateAndLevel({ ...log, level: Level.Error })
      c.error(this.composeConsoleSubstitution(args), ...args)
    }

    assert(cond: boolean, log: Log) {
      let args = this.addDateAndLevel({ ...log, level: Level.Error })
      c.assert(cond, this.composeConsoleSubstitution(args), ...args)
    }

    public setDateGetter(dateGetter: (timestamp: number) => string) {
      this.options.dateGetter = dateGetter
    }

    private addDateAndLevel(log: Log) {
      return [this.prepareDate(log.timestamp), `${log.level}`, ...(log.args || [])]
    }

    private composeConsoleSubstitution(data: Array<any>, startingVarConvertionIndex = 2): string {
      let str = ""
      for (let i = 0; i < data.length; i++) {
        let last = i === data.length - 1
        let v = data[i]

        if (!last && i > startingVarConvertionIndex && typeof v === "string" && v.trim().indexOf(" ") === -1) {
          data[i] = `${v}=`
        }

        if (typeof v === "string") {
          str += `%s`
          continue
        }

        if (typeof v === "number") {
          str += `%d`
          continue
        }

        str += `%o`
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
