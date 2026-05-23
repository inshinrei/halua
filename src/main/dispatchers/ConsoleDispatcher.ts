import type { BaseDispatcherOptions, DispatcherExecuteMeta } from "./DispatcherTypes"
import { DispatcherBase } from "./DispatcherBase"
import { redact } from "../format"

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
            constructor(
                readonly console: OutputConsole,
                options: ConsoleDispatcherOptions = {},
            ) {
                super(() => {}, options)
            }

            public dispatch(meta: DispatcherExecuteMeta, rawArgs: any[], errorMeta?: Record<string, any>): void {
                let effectiveRe = this.redactDataRegExp || (meta as any).redactDataRegExp
                let processedRawArgs = effectiveRe ? rawArgs.map((v: any) => redact(v, effectiveRe)) : rawArgs
                let processedErrorMeta = errorMeta
                if (effectiveRe && errorMeta != null) {
                    processedErrorMeta = redact(errorMeta, effectiveRe) as Record<string, any>
                }

                let args: Array<any> = []

                if (this.printTimestamp) {
                    args.push(`${this.formatTimestamp(meta.timestamp)}`)
                }

                if (this.printLevel) {
                    let margin = this.printTimestamp ? " " : ""
                    args.push(`${margin}${meta.level}`)
                }

                for (let value of processedRawArgs) {
                    let formatted: any
                    if (typeof this.formatArg === "function") {
                        formatted = this.formatArg(value)
                    } else {
                        formatted = value
                    }
                    args.push(formatted)
                }

                if (processedErrorMeta !== undefined) {
                    let m = typeof this.formatArg === "function" ? this.formatArg(processedErrorMeta) : processedErrorMeta
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
