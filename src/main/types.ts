import { LogLevel } from "../types/log"
import { Dispatcher } from "./dispatchers/dispatcher-types"

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

export interface Feature<Api = {}> {
    contributeDispatchers?: () => Array<() => Dispatcher>
    apply: (host: HaluaLogger<any, any>) => Api
}

export interface SpanFlowApi {
    flow(name: string, ctx?: Record<string, unknown>): this
    span(label: string): () => number
    span<T>(label: string, fn: (log: this) => T): T
}

export interface HaluaLogger<ErrorMeta = Record<string, any>, Caps = {}> {
    create: {
        <EM = ErrorMeta>(dispatcher: PassedDispatcher): HaluaLogger<EM, Caps> & Caps
        <EM = ErrorMeta>(options: HaluaOptions): HaluaLogger<EM, Caps> & Caps
        <EM = ErrorMeta>(arg1?: PassedDispatcher | HaluaOptions, options?: HaluaOptions): HaluaLogger<EM, Caps> & Caps
    }
    child: (...args: any[]) => HaluaLogger<ErrorMeta, Caps> & Caps

    setDispatchers: (dispatcher: PassedDispatcher) => void
    appendDispatchers: (dispatcher: PassedDispatcher) => void

    logTo: (level: LogLevel, ...args: any[]) => void
    trace: (...args: any[]) => void
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    notice: (...args: any[]) => void
    error: (error: unknown, meta?: ErrorMeta) => void
    fatal: (...args: any[]) => void
    assert: (assertion: boolean, error: unknown, meta?: ErrorMeta) => void

    stamp: (label: string, id?: any) => () => number
    stampEnd: (id: any) => number | undefined
}

export interface HaluaOptions {
    level?: LogLevel
    withArgs?: Array<any>
    /** RegExp used to redact sensitive data (keys in objects/maps, content in strings). Overrides per-dispatcher if set on dispatcher. */
    redactDataRegExp?: RegExp
}

export type PassedDispatcher = (() => Dispatcher) | Array<() => Dispatcher>
