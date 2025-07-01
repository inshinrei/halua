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
      c.debug(...this.composeArgs({ ...log, level: Level.Debug }))
    }

    info(log: Log) {
      c.log(...this.composeArgs({ ...log, level: Level.Info }))
    }

    warn(log: Log) {
      c.warn(...this.composeArgs({ ...log, level: Level.Warn }))
    }

    error(log: Log) {
      c.error(...this.composeArgs({ ...log, level: Level.Error }))
    }

    assert(cond: boolean, log: Log) {
      c.assert(cond, ...this.composeArgs({ ...log, level: Level.Error }))
    }

    public setDateGetter(dateGetter: (timestamp: number) => string) {
      this.options.dateGetter = dateGetter
    }

    private composeArgs(log: Log): Array<any> {
      let args: Array<any> = []
      args.push(this.prepareDate(log.timestamp))
      args.push(`${log.level}`)
      args.push(`${log.message}`)
      if (log.args) {
        args.push(...log.args)
      }
      if (Object.keys(log.variables).length) {
        args.push(...this.composeVarsArgs(log.variables))
      }
      return args
    }

    private composeVarsArgs(data: Record<string, any>): Array<any> {
      let args: Array<any> = []
      for (let key in data) {
        let currArgs = [`${key}=`, data[key]]
        args.push(...currArgs)
      }
      return args
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
