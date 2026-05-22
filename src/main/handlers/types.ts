import { type LogLevel } from "../../types/log"

export interface HandlerExecuteMeta {
    timestamp: number
    level: LogLevel
}

export interface Handler {
    /** indicates min level to log */
    level: LogLevel | undefined
    /** indicates exact levels to log */
    exact: Array<LogLevel> | null
    /** indicates if objects should contain spaces and tabs */
    spacing?: boolean

    printTimestamp?: boolean
    printLevel?: boolean

    /** primary dispatch: receives raw args; handler decides formatting / structure / emission */
    dispatch: (meta: HandlerExecuteMeta, args: any[]) => void

    formatArg?: (value: any) => any
    formatTimestamp?: (value: number) => string
}

export interface BaseHandlerOptions {
    level?: LogLevel
    exact?: LogLevel | Array<LogLevel>
    spacing?: boolean
    printTimestamp?: boolean
    printLevel?: boolean
}
