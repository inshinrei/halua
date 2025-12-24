import type { LogLevel } from "../../types/log"
import { HandlerBase, SendMethod } from "./HandlerBase"
import { formatJSON } from "../format"
import type { BaseHandlerOptions, HandlerExecuteMeta, NextMessage, YieldMessage } from "./types"
import { getType } from "../getType"
import { toarray } from "../util/cast"

interface JSONLogHandlerOptions extends BaseHandlerOptions {}

export function NewJSONHandler(send: (data: string) => void, options?: JSONLogHandlerOptions) {
    return () =>
        new (class JSONHandler extends HandlerBase {
            public level: LogLevel
            public exact: Array<LogLevel>

            constructor(send: SendMethod, options: JSONLogHandlerOptions = {}) {
                super(send)

                this.applyOptionalOptions(options)
                this.level = options.level ?? "TRACE"
                this.exact = toarray(options.exact ?? []) as Array<LogLevel>
            }

            readonly formatArg = (arg: any) => {
                let type = getType(arg)
                let formatted = formatJSON({ type, value: arg })
                if (type !== "object" && type !== "map") {
                    return `"${formatted}"`
                }
                return formatted
            }

            public *execute(meta: HandlerExecuteMeta): Generator<YieldMessage, void, NextMessage> {
                let arg = "\{"
                let current: NextMessage = { value: null, type: "init" }

                if (this.printTimestamp) {
                    arg += `\"timestamp\":\"${this.formatTimestamp(meta.timestamp)}\",`
                }

                if (this.printLevel) {
                    arg += `\"level\":\"${meta.level}\",`
                }

                arg += `\"args\":\[`
                while (true) {
                    if (current.type === "init") {
                        current = yield { type: "init" }
                    }

                    if (current.prev) {
                        arg += `\"${current.prev}\",`
                    }

                    if (current.type === "done") {
                        break
                    }

                    if (current.type === "arg") {
                        if (typeof this.formatArg === "function") {
                            arg += `${this.formatArg(current.value)},`
                            current = yield { type: "done" }
                            continue
                        }
                    }

                    current = yield { type: "pass" }
                }
                if (arg.at(-1) === ",") {
                    arg = arg.slice(0, arg.length - 1)
                }
                arg += `\]\}`

                this.sendMethod(arg)
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
