import type { LogLevel } from "../../types/log"
import { HandlerBase, SendMethod } from "./HandlerBase"
import { toJSONValue } from "../format"
import type { BaseHandlerOptions, HandlerExecuteMeta, NextMessage, YieldMessage } from "./types"
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

            readonly formatArg = (arg: any) => arg

            public *execute(meta: HandlerExecuteMeta): Generator<YieldMessage, void, NextMessage> {
                let args: any[] = []
                let current: NextMessage = { value: null, type: "init" }

                while (true) {
                    if (current.type === "init") {
                        current = yield { type: "init" }
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
