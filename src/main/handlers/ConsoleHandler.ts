import { BaseHandlerOptions, type NextMessage, type YieldMessage } from "./types"
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

            readonly formatArg = (arg: any) => arg

            applyOptionalOptions(options: ConsoleHandlerOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }

            public *execute(meta: { timestamp: number; level: string }): Generator<YieldMessage, void, NextMessage> {
                let args: Array<any> = []
                let current: NextMessage = { value: null, type: "init" }

                if (this.printTimestamp) {
                    args.push(`${this.formatTimestamp(meta.timestamp)}`)
                }

                if (this.printLevel) {
                    let margin = this.printTimestamp ? " " : ""
                    args.push(`${margin}${meta.level}`)
                }

                while (true) {
                    if (current.type === "init") {
                        current = yield { type: "init" }
                    }

                    if (current.prev) {
                        args.push(current.prev)
                    }

                    if (current.type === "done") {
                        break
                    }

                    if (current.type === "arg") {
                        if (typeof this.formatArg === "function") {
                            args.push(current.value)
                            current = yield { type: "done" }
                            continue
                        }
                    }

                    current = yield { type: "pass" }
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
