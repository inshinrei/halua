import { type LogLevel } from "../../types/log"

export interface HandlerExecuteMeta {
    timestamp: number
    level: LogLevel
}

export interface Handler {
    /** indicates min level to log */
    level?: LogLevel
    /** indicates exact levels to log */
    exact?: Array<LogLevel> | LogLevel
    /** indicates if objects should contain spaces and tabs */
    spacing?: boolean

    printTimestamp?: boolean
    printLevel?: boolean

    execute: (meta: HandlerExecuteMeta) => Generator<YieldMessage, void, NextMessage>

    formatArg?: (value: any) => any
    formatTimestamp?: (value: number) => string
}

export interface NextMessage {
    type: NextMessageType
    value: any
    prev?: string
}

export interface YieldMessage {
    type: YieldMessageType
}

type YieldMessageType = "pass" | "done" | "init"

type NextMessageType = "arg" | "done" | "init"
