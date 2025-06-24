export interface Handler {
  debug: (msg: string, ...args: any[]) => void
  info: (msg: string, ...args: any[]) => void
  warn: (msg: string, ...args: any[]) => void
  error: (msg: string, ...args: any[]) => void
}

type LoggerFn = (msg: string, ...args: any[]) => void

export interface Logger {
  debug: LoggerFn
  info: LoggerFn
  warn: LoggerFn
  err: LoggerFn
  assert: (value: boolean, msg: string, ...args: any[]) => void
  setHandler: (handler: Handler) => void
  setDateGetter: (getter: () => string | number) => void
}

export interface LoggerOptions {
  minLevel?: Level
  postfix?: string
  pretty?: boolean
  dateGetter?: (() => string | number) | null | undefined
}

interface Log {
  msg: string
  level: Level
  timestamp: string
  variables: Record<string, any>
}

export enum Level {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERR',
}
