import type { Handler, Log, LogLevel } from "./types"
import { Level } from "./types"
import { replaceDataBeforeStringify } from "../util/dataReplacer"
import { arrayed } from "../util/array"

interface JSONLogHandler extends Handler {
    setDateGetter: (getter: (timestamp: number) => string) => void
}

interface JSONLogHandlerOptions {
    /** change timestamp output */
    dateGetter?: (timestamp: number) => string
    /** replace value during stringify, return null to fallback on JSONHandler replacer */
    replaceBeforeStringify?: (value: any) => any
    linkArguments?: boolean
    level?: LogLevel
    exact?: LogLevel | Array<LogLevel>
}

export function NewJSONHandler(
    send: (data: string) => void,
    options: JSONLogHandlerOptions = {},
): () => JSONLogHandler {
    return () =>
        new (class JSONLog implements JSONLogHandler {
            public level?: LogLevel
            public exact?: Array<LogLevel>

            private readonly takenNames = new Set(["timestamp", "level", "args"])

            constructor(private readonly options: JSONLogHandlerOptions) {
                this.level = options.level
                this.exact = options.exact ? arrayed(options.exact) : undefined
                this.options = options || {}
            }

            log(log: Log) {
                this.sendLog(log)
            }

            public setDateGetter(getter: (timestamp: number) => string) {
                this.options.dateGetter = getter
            }

            private sendLog(log: Log) {
                try {
                    delete log.assertion
                    delete log.messageFormat
                    delete log.leveling
                    log.timestamp = this.formatDate(log.timestamp as number)
                    send(JSON.stringify(this.flattenLinkedArguments(log), this.replacer.bind(this)))
                } catch (err) {
                    if (log.level !== Level.Error) {
                        this.log({
                            args: [`err while trying to stringify JSON ${err}`],
                            timestamp: log.timestamp,
                            level: Level.Error,
                            leveling: [Level.Error, 0],
                        })
                    }
                }
            }

            private formatDate(timestamp: number) {
                if (this.options?.dateGetter) {
                    return this.options.dateGetter(timestamp)
                }
                return new Date(timestamp).toISOString()
            }

            private flattenLinkedArguments(log: Log): Record<string, any> {
                if (this.options?.linkArguments !== undefined && this.options?.linkArguments === false) {
                    return log
                }
                if (log.withArgs) {
                    this.composeLogWithArgsFlattened(log)
                }
                delete log.withArgs
                return log
            }

            private composeLogWithArgsFlattened(log: Log) {
                let composedLog: Record<string, any> = log
                let name = ""
                for (let arg of log.withArgs!) {
                    if (typeof arg === "string" && this.stringMatchesVar(arg)) {
                        name = arg
                        continue
                    }
                    if (name && !this.takenNames.has(name)) {
                        composedLog[name] = arg
                        name = ""
                        continue
                    }
                    log.args?.push(arg)
                }
                return log
            }

            private stringMatchesVar(str: string): boolean {
                return str.trim().indexOf(" ") === -1
            }

            private replacer(_: string, value: any) {
                if (this.options.replaceBeforeStringify) {
                    let v = this.options.replaceBeforeStringify(value)
                    if (v !== null) {
                        return v
                    }
                }
                return replaceDataBeforeStringify(value)
            }
        })(options)
}
