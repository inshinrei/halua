export interface Log {
    timestamp: number
    // argsgen: Generator
    level: string
    assertion?: boolean
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
