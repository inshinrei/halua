import { Handler, Level } from "./handlers/types"

export interface HaluaOptions {
    minLevel?: Level
    withArgs?: Array<any>
    messageFormat?: string
    errorPolicy?: "throw" | "pass"
}

export interface HaluaLogger {
    New: {
        (handler: Handler | Array<Handler>): HaluaLogger
        (options: HaluaOptions): HaluaLogger
        (arg1?: Handler | Array<Handler> | HaluaOptions, arg2?: HaluaOptions): HaluaLogger
    }
    With: (...args: any[]) => HaluaLogger
    withMessageFormat: (format: string) => HaluaLogger
    setHandler: (handler: Handler | Array<Handler>) => void
    appendHandler: (handler: Handler) => void

    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    assert: (assertion: boolean, ...args: any[]) => void
}
