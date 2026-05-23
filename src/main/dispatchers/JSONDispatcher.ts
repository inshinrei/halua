import type { LogLevel } from "../../types/log"
import { DispatcherBase, SendMethod } from "./DispatcherBase"
import { toJSONValue } from "../format"
import type { BaseDispatcherOptions, DispatcherExecuteMeta } from "./DispatcherTypes"
import { toarray } from "../util/cast"

interface JSONLogDispatcherOptions extends BaseDispatcherOptions {}

export function NewJSONDispatcher(send: (data: string) => void, options?: JSONLogDispatcherOptions) {
    return () =>
        new (class JSONDispatcher extends DispatcherBase {
            public level: LogLevel | undefined
            public exact: Array<LogLevel> | null = null

            constructor(send: SendMethod, options: JSONLogDispatcherOptions = {}) {
                super(send)

                this.applyOptionalOptions(options)
                this.level = options.level
                this.exact = options.exact ? (toarray(options.exact) as Array<LogLevel>) : null
            }

            public dispatch(meta: DispatcherExecuteMeta, args: any[]): void {
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

            applyOptionalOptions(options: JSONLogDispatcherOptions) {
                this.printTimestamp = options.printTimestamp ?? true
                this.printLevel = options.printLevel ?? true
            }
        })(send, options)
}
