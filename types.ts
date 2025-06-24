export interface Handler {
  debug: (msg: string) => void
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
}

type LoggerFn = (msg: string, ...args: any[]) => void

export interface Logger {
  debug: LoggerFn
  info: LoggerFn
  warn: LoggerFn
  err: LoggerFn
  assert: (value: boolean, msg: string, ...args: any[]) => void
  setHandler: (handler: Handler) => void
  setDateGetter: (getter: (() => string | number)) => void
}

export interface LoggerOptions {
  minLevel?: Level
  postfix?: string
  dateGetter?: (() => string | number) | null | undefined
}

export enum Level {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERR',
}
