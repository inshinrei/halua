import { LogLevel } from "../types/log"
import { Dispatcher } from "./dispatchers/DispatcherTypes"

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
    create: {
        (dispatcher: PassedDispatcher): HaluaLogger
        (options: HaluaOptions): HaluaLogger
        (arg1?: PassedDispatcher | HaluaOptions, options?: HaluaOptions): HaluaLogger
    }
    child: (...args: any[]) => HaluaLogger

    setDispatchers: (dispatcher: PassedDispatcher) => void
    appendDispatchers: (dispatcher: PassedDispatcher) => void

    logTo: (level: LogLevel, ...args: any[]) => void
    trace: (...args: any[]) => void
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    notice: (...args: any[]) => void
    error: (...args: any[]) => void
    fatal: (...args: any[]) => void
    assert: (assertion: boolean, ...args: any[]) => void

    stamp: (label: string, id?: any) => () => void
    stampEnd: (id: any) => void
}

export interface HaluaOptions {
    level?: LogLevel
    withArgs?: Array<any>
}

export type PassedDispatcher = (() => Dispatcher) | Array<() => Dispatcher>
