import type { LogLevel } from "../../types/log"
import { HandlerBase, SendMethod } from "./HandlerBase"
import { toJSONValue } from "../format"
import type { BaseHandlerOptions, HandlerExecuteMeta } from "./types"
import { toarray } from "../util/cast"

interface JSONLogHandlerOptions extends BaseHandlerOptions {}

export function NewJSONHandler(send: (data: string) => void, options?: JSONLogHandlerOptions) {
    return () =>
        new (class JSONHandler extends HandlerBase {
            public level: LogLevel | undefined
            public exact: Array<LogLevel> | null = null

            constructor(send: SendMethod, options: JSONLogHandlerOptions = {}) {
                super(send)

                this.applyOptionalOptions(options)
                this.level = options.level
                this.exact = options.exact ? (toarray(options.exact) as Array<LogLevel>) : null
            }

            public dispatch(meta: HandlerExecuteMeta, args: any[]): void {
                let obj: any = {}
                if (this.printTimestamp) {
                    obj.timestamp = this.formatTimestamp(meta.timestamp)
                }
                if (this.printLevel) {
                    obj.level = meta.level
                }
                obj.args = args.map((a: any) => toJSONValue(a))

                this.sendMethod(JSON.stringify(obj))
            }

            public formatTimestamp(t: number) {
                return new Date(t).toISOString()
            }

            applyOptionalOptions(options: JSONLogHandlerOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }
        })(send, options)
}
