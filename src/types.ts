import { Handler, Level } from "./handlers/types"

export interface HaluaOptions {
  minLevel?: Level
}

export interface HaluaLogger {
  New: (handler?: Handler, options?: HaluaOptions) => HaluaLogger
  // With:(...args: any[]) => HaluaLogger
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  assert: (assertion: boolean, ...args: any[]) => void
}
