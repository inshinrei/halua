export interface Handler {
  debug: (log: Log) => void
  info: (log: Log) => void
  warn: (log: Log) => void
  error: (log: Log) => void
  assert: (assertion: boolean, log: Log) => void
}

export interface Log {
  timestamp: number | string
  level?: Level
  args?: Array<any>
  withArgs?: null | Array<any>
}

export enum Level {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERR",
}
