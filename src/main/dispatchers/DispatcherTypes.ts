import { type LogLevel } from "../../types/log"

export interface DispatcherExecuteMeta {
    timestamp: number
    level: LogLevel
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

    /** primary dispatch: receives raw args; dispatcher decides formatting / structure / emission */
    dispatch: (meta: DispatcherExecuteMeta, args: any[]) => void

    formatArg?: (value: any) => any
    formatTimestamp?: (value: number) => string
}

export interface BaseDispatcherOptions {
    level?: LogLevel
    exact?: LogLevel | Array<LogLevel>
    spacing?: boolean
    printTimestamp?: boolean
    printLevel?: boolean
}
