import { Handler, Level } from "./handlers/types"

export interface HaluaOptions {
  minLevel?: Level
  postArgs?: Array<any>
}

export interface HaluaLogger {
  New: {
    (handler: Handler): HaluaLogger
    (options: HaluaOptions): HaluaLogger
    (arg1?: Handler | HaluaOptions, arg2?: HaluaOptions): HaluaLogger
  }
  With: (...args: any[]) => HaluaLogger
  setHandler: (handler: Handler) => void

  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  assert: (assertion: boolean, ...args: any[]) => void
}
