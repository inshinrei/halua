import { LogLevel } from "../types/log"
import { Handler } from "./handlers/types"

export type ArgumentType =
    | "undefined"
    | "null"
    | "boolean"
    | "string"
    | "number"
    | "array"
    | "object"
    | "symbol"
    | "typedarray"
    | "arraybuffer"
    | "bigint"
    | "map"
    | "set"
    | "weakmap"
    | "weakset"
    | "date"
    | "nan"
    | "infinity"
    | "function"
    | "error"

export interface Argument {
    type: ArgumentType
    value: any
}

export interface HaluaLogger {
    New: {
        (handler: PassedHandler): HaluaLogger
        (options: HaluaOptions): HaluaLogger
        (arg1: PassedHandler | HaluaOptions, options?: HaluaOptions): HaluaLogger
    }
    With: (...args: any[]) => HaluaLogger

    setHandlers: (handler: PassedHandler) => void
    appendHandlers: (handler: PassedHandler) => void

    logTo: (level: LogLevel, ...args: any[]) => void
    trace: (...args: any[]) => void
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    notice: (...args: any[]) => void
    error: (...args: any[]) => void
    fatal: (...args: any[]) => void
    assert: (assertion: boolean, ...args: any[]) => void
}

export interface HaluaOptions {
    level?: LogLevel
    withArgs?: Array<any>
}

export type PassedHandler = (() => Handler) | Array<() => Handler>
