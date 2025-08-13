export interface Handler {
    skipDeepCopyWhenSendingLog?: boolean
    level?: LogLevel
    log: (log: Log) => void
}

export interface Log {
    timestamp: number | string
    level: LogLevel
    args: Array<any>
    messageFormat?: string
    assertion?: boolean
    withArgs?: null | Array<any>
}

export enum Level {
    Trace = "TRACE",
    Debug = "DEBUG",
    Info = "INFO",
    Notice = "NOTICE",
    Warn = "WARN",
    Error = "ERROR",
    Fatal = "FATAL",
}

export type LogLevel = keyof Level | string
