import { Handler, Level } from "./handlers/types"

export interface HaluaOptions {
    level?: Level
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

    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    assert: (assertion: boolean, ...args: any[]) => void
}

export type PassedHandler = (() => Handler) | Array<() => Handler>
