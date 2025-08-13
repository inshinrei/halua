import { Handler, LogLevel } from "./handlers/types"

export interface HaluaOptions {
    level?: LogLevel
    withArgs?: Array<any>
    messageFormat?: string
    errorPolicy?: "throw" | "pass"
}

export interface HaluaLogger {
    New: {
        (handler: PassedHandler): HaluaLogger
        (options: HaluaOptions): HaluaLogger
        (arg1?: PassedHandler | HaluaOptions, arg2?: HaluaOptions): HaluaLogger
    }
    With: (...args: any[]) => HaluaLogger
    withMessageFormat: (format: string) => HaluaLogger
    setHandler: (handler: PassedHandler) => void
    appendHandler: (handler: () => Handler) => void

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

export type PassedHandler = (() => Handler) | Array<() => Handler>
export type HandlerField = "trace" | "debug" | "info" | "warn" | "notice" | "error" | "fatal" | "assert"
