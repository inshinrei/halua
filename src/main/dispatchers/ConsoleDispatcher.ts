import { BaseDispatcherOptions, DispatcherExecuteMeta } from "./DispatcherTypes"
import { DispatcherBase } from "./DispatcherBase"
import { LogLevel } from "../../types/log"
import { toarray } from "../util/cast"

interface OutputConsole {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
}

interface ConsoleDispatcherOptions extends Omit<BaseDispatcherOptions, "spacing"> {}

export function NewConsoleDispatcher(console: OutputConsole, options?: ConsoleDispatcherOptions) {
    return () =>
        new (class ConsoleDispatcher extends DispatcherBase {
            public level: LogLevel | undefined
            public exact: Array<LogLevel> | null = null

            constructor(
                readonly console: OutputConsole,
                options: ConsoleDispatcherOptions = {},
            ) {
                super()

                this.applyOptionalOptions(options)
                this.level = options.level
                this.exact = options.exact ? (toarray(options.exact) as Array<LogLevel>) : null
            }

            applyOptionalOptions(options: ConsoleDispatcherOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }

            public dispatch(meta: DispatcherExecuteMeta, rawArgs: any[], errorMeta?: Record<string, any>): void {
                let args: Array<any> = []

                if (this.printTimestamp) {
                    args.push(`${this.formatTimestamp(meta.timestamp)}`)
                }

                if (this.printLevel) {
                    let margin = this.printTimestamp ? " " : ""
                    args.push(`${margin}${meta.level}`)
                }

                for (let value of rawArgs) {
                    let formatted: any
                    if (typeof this.formatArg === "function") {
                        formatted = this.formatArg(value)
                    } else {
                        formatted = value
                    }
                    args.push(formatted)
                }

                if (errorMeta !== undefined) {
                    let m = typeof this.formatArg === "function" ? this.formatArg(errorMeta) : errorMeta
                    args.push(m)
                }

                if (meta.level.startsWith("DEBUG")) {
                    this.console.debug(...args)
                    return
                }

                if (meta.level.startsWith("WARN")) {
                    this.console.warn(...args)
                    return
                }

                if (meta.level.startsWith("ERROR") || meta.level.startsWith("FATAL")) {
                    this.console.error(...args)
                    return
                }

                this.console.info(...args)
            }
        })(console, options)
}
