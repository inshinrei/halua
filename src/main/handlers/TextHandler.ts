import { HandlerBase } from "./HandlerBase"
import { LogLevel } from "../../types/log"

interface TextLogHandler extends HandlerBase {}

interface TextLogHandlerOptions {}

export function NewTextHandler(send: (data: string) => void, options: TextLogHandlerOptions) {
    return () =>
        new (class TextHandler implements TextLogHandler {
            public level?: LogLevel
            public exact?: Array<LogLevel>

            constructor(
                private send: (data: string) => void,
                private options: TextLogHandlerOptions,
            ) {
                this.level = options.level
                // this.exact = arrayed(exact)
            }
        })(send, options)
}
