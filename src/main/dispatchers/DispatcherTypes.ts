import { type LogLevel } from "../../types/log"

export interface DispatcherExecuteMeta {
    timestamp: number
    level: LogLevel
    /** optional default redact regexp from the logger instance (per-dispatcher options override it) */
    redactDataRegExp?: RegExp
}

export interface Dispatcher {
    /** indicates min level to log */
    level: LogLevel | undefined
    /** indicates exact levels to log */
    exact: Array<LogLevel> | null
    /** indicates if objects should contain spaces and tabs */
    spacing?: boolean

    printTimestamp?: boolean
    printLevel?: boolean

    /** RegExp for redacting sensitive data in this dispatcher's output (takes precedence over logger-level) */
    redactDataRegExp?: RegExp

    /** primary dispatch: receives the execution meta, the primary log values (args), and optional errorMeta
     *  (only populated for calls that went through .error(err, meta) or .assert(cond, err, meta)).
     *  The errorMeta is deliberately kept separate from args so it does not pollute the "log values" list
     *  and can be rendered specially by Text/JSON/Console dispatchers (e.g. top-level "meta" field in JSON).
     */
    dispatch: (meta: DispatcherExecuteMeta, args: any[], errorMeta?: Record<string, any>) => void

    formatArg?: (value: any) => any
    formatTimestamp?: (value: number) => string
}

export interface ConsoleLike {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
}

export interface BaseDispatcherOptions {
    level?: LogLevel
    exact?: LogLevel | Array<LogLevel>
    spacing?: boolean
    printTimestamp?: boolean
    printLevel?: boolean
    /** RegExp for redacting sensitive data (keys in objs/maps + content matches in strings). Takes precedence over any logger-level redactDataRegExp. */
    redactDataRegExp?: RegExp
}
