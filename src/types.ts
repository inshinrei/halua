import { Handler, Level } from "./handlers/types"

export interface HaluaOptions {
  minLevel?: Level
}

export interface HaluaLogger {
  New: (handler?: Handler, options?: HaluaOptions) => HaluaLogger
  // With:() => {}
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  assert: (assertion: boolean, message: string, ...args: any[]) => void
}
