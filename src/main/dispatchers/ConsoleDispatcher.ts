import type { ConsoleDispatcherOptions, ConsoleLike, DispatcherExecuteMeta } from "./DispatcherTypes"
import { DispatcherBase } from "./DispatcherBase"
import { prepareDispatchArgs, routeConsoleCall } from "./DispatcherTypes"

export function NewConsoleDispatcher(console: ConsoleLike, options?: ConsoleDispatcherOptions) {
    return () =>
        new (class ConsoleDispatcher extends DispatcherBase {
            constructor(readonly console: ConsoleLike, options: ConsoleDispatcherOptions = {}) {
                super(() => {}, options)
            }

            public dispatch(meta: DispatcherExecuteMeta, rawArgs: any[], errorMeta?: Record<string, any>): void {
                let { processedRawArgs, processedErrorMeta } = prepareDispatchArgs(
                    this.redactDataRegExp,
                    meta,
                    rawArgs,
                    errorMeta
                )

                let args: any[] = []

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

                routeConsoleCall(this.console, meta.level, args)
            }
        })(console, options)
}
