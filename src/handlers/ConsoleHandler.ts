import { Handler, Level, Log } from "./types"

interface ConsoleLogHandler extends Handler {}

interface ConsoleLogHandlerConsole {
  debug: (...args: any[]) => void
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  assert: (c: boolean, ...args: any[]) => void
}

export function ConsoleHandler(c: ConsoleLogHandlerConsole = console): ConsoleLogHandler {
  return new (class ConsoleLog implements ConsoleLogHandler {
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

    private composeArgs(log: Log): Array<any> {
      let args: Array<any> = []
      args.push(log.timestamp)
      args.push(` ${log.level}`)
      args.push(` ${log.message}`)
      return args
    }
  })()
}
