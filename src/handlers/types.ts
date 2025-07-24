export interface Handler {
    skipDeepCopyWhenSendingLog?: boolean
    log: (log: Log) => void
}

export interface Log {
    timestamp: number | string
    level: Level
    args: Array<any>
    messageFormat?: string
    assertion?: boolean
    withArgs?: null | Array<any>
}

export enum Level {
    Debug = "DEBUG",
    Info = "INFO",
    Warn = "WARN",
    Error = "ERR",
}
