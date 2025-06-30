export interface Handler {
  debug: (log: Log) => void
  info: (log: Log) => void
  warn: (log: Log) => void
  error: (log: Log) => void
  assert: (c: boolean, log: Log) => void
}

export interface Log {
  message: string
  variables: Record<string, any>
  timestamp: number | string
  level?: Level
}

export enum Level {
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERR",
}
