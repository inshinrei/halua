import { type LogLevel } from "../../types/log"

export interface Handler {
    /** indicates min level to log */
    level?: LogLevel
    /** indicates exact levels to log */
    exact?: Array<LogLevel> | LogLevel
    /** indicates if objects should contain spaces and tabs */
    spacing?: boolean

    execute: () => Generator<YieldMessage, void, NextMessage>

    formatArg?: (value: any) => any
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
