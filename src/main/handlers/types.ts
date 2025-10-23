import { type LogLevel } from "../../types/log"

export interface Handler {
    /** indicates min level to log */
    level?: LogLevel
    /** indicates exact levels to log */
    exact?: Array<LogLevel> | LogLevel
    /** indicates if objects should contain spaces and tabs */
    spacing?: boolean

    execute: () => Generator<ExecuteResponse, void, ExecuteMessage>

    formatArg?: (value: any) => any
}

export interface ExecuteMessage {
    type: MessageType
    value: any
    prev?: string
}

export interface ExecuteResponse {
    type: ExecuteResponseType
}

type ExecuteResponseType = "pass" | "done" | "init"

type MessageType = "arg" | "done" | "init"
