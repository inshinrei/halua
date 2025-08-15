export interface Handler {
    skipDeepCopyWhenSendingLog?: boolean
    level?: LogLevel
    exact?: Array<LogLevel>
    log: (log: Log) => void
}

export interface Log {
    timestamp: number | string
    level: LogLevel
    leveling?: [Level, number]
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

export type LogLevel = string
