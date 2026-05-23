import { DispatcherBase, SendMethod } from "./DispatcherBase"
import { LogLevel } from "../../types/log"
import { format } from "../format"
import { getType } from "../getType"
import { toarray } from "../util/cast"
import { BaseDispatcherOptions, DispatcherExecuteMeta } from "./DispatcherTypes"

interface TextLogDispatcherOptions extends BaseDispatcherOptions {}

export function NewTextDispatcher(send: (data: string, errorMeta?: Record<string, any>) => void, options?: TextLogDispatcherOptions) {
    return () =>
        new (class TextDispatcher extends DispatcherBase {
            public level: LogLevel | undefined
            public exact: Array<LogLevel> | null = null

            constructor(send: SendMethod, options: TextLogDispatcherOptions = {}) {
                super(send)

                this.applyOptionalOptions(options)
                this.level = options.level
                this.exact = options.exact ? (toarray(options.exact) as Array<LogLevel>) : null

                this.formatArg = (value: any) => format({ type: getType(value), value }, options.spacing)
            }

            public dispatch(meta: DispatcherExecuteMeta, args: any[], errorMeta?: Record<string, any>): void {
                let parts: any[] = []

                if (this.printTimestamp) {
                    parts.push(this.formatTimestamp(meta.timestamp))
                }

                if (this.printLevel) {
                    parts.push(meta.level)
                }

                for (let value of args) {
                    let formatted: any
                    if (typeof this.formatArg === "function") {
                        formatted = this.formatArg(value)
                    } else {
                        formatted = value
                    }
                    parts.push(formatted)
                }

                this.sendMethod(parts.join(" "), errorMeta)
            }

            applyOptionalOptions(options: TextLogDispatcherOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }
        })(send, options)
}
