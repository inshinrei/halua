import { HandlerBase, SendMethod } from "./HandlerBase"
import { LogLevel } from "../../types/log"
import { format } from "../format"
import { getType } from "../getType"
import { toarray } from "../util/cast"
import { BaseHandlerOptions } from "./types"

interface TextLogHandlerOptions extends BaseHandlerOptions {}

export function NewTextHandler(send: (data: string) => void, options?: TextLogHandlerOptions) {
    return () =>
        new (class TextHandler extends HandlerBase {
            public level: LogLevel
            public exact: Array<LogLevel>

            readonly formatArg

            constructor(send: SendMethod, options: TextLogHandlerOptions = {}) {
                super(send)

                this.applyOptionalOptions(options)
                this.level = options.level ?? "TRACE"
                this.exact = toarray(options?.exact ?? []) as Array<LogLevel>

                this.formatArg = (value: any) => format({ type: getType(value), value })
            }

            applyOptionalOptions(options: TextLogHandlerOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }
        })(send, options)
}
