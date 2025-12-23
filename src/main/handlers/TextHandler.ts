import { HandlerBase, SendMethod } from "./HandlerBase"
import { LogLevel } from "../../types/log"
import { format } from "../format"
import { getType } from "../getType"
import { toarray } from "../util/cast"

interface TextLogHandlerOptions {
    level?: LogLevel
    exact?: LogLevel | Array<LogLevel>
    spacing?: boolean
    printTimestamp?: boolean
    printLevel?: boolean
}

export function NewTextHandler(send: (data: string) => void, options?: TextLogHandlerOptions) {
    return () =>
        new (class TextHandler extends HandlerBase {
            public level?: LogLevel
            public exact?: Array<LogLevel>

            readonly formatArg

            constructor(send: SendMethod, options: TextLogHandlerOptions = {}) {
                super(send)
                this.applyOptions(options)

                this.formatArg = (value: any) => format({ type: getType(value), value })
            }

            applyOptions(options: TextLogHandlerOptions) {
                this.level = options.level ?? "TRACE"
                this.exact = toarray(options?.exact ?? []) as Array<LogLevel>
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }
        })(send, options)
}
