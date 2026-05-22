import { BaseHandlerOptions, HandlerExecuteMeta } from "./types"
import { HandlerBase } from "./HandlerBase"
import { LogLevel } from "../../types/log"
import { toarray } from "../util/cast"

interface OutputConsole {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
}

interface ConsoleHandlerOptions extends Omit<BaseHandlerOptions, "spacing"> {}

export function NewConsoleHandler(console: OutputConsole, options?: ConsoleHandlerOptions) {
    return () =>
        new (class ConsoleHandler extends HandlerBase {
            public level: LogLevel | undefined
            public exact: Array<LogLevel> | null = null

            constructor(
                readonly console: OutputConsole,
                options: ConsoleHandlerOptions = {},
            ) {
                super()

                this.applyOptionalOptions(options)
                this.level = options.level
                this.exact = options.exact ? (toarray(options.exact) as Array<LogLevel>) : null
            }

            applyOptionalOptions(options: ConsoleHandlerOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }

            public dispatch(meta: HandlerExecuteMeta, rawArgs: any[]): void {
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
