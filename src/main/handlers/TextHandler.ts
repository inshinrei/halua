import { HandlerBase, SendMethod } from "./HandlerBase"
import { LogLevel } from "../../types/log"
import { format } from "../format"
import { getType } from "../getType"

interface TextLogHandlerOptions {
    level: LogLevel
}

export function NewTextHandler(send: (data: string) => void, options: TextLogHandlerOptions) {
    return () =>
        new (class TextHandler extends HandlerBase {
            public level?: LogLevel
            public exact?: Array<LogLevel>

            readonly formatArg

            constructor(send: SendMethod, options: TextLogHandlerOptions) {
                super(send)
                this.level = options.level
                // this.exact = arrayed(exact)

                this.formatArg = (value: any) => format({ type: getType(value), value })
            }
        })(send, options)
}
