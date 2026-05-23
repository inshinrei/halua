import { DispatcherBase, SendMethod } from "./dispatcher-base"
import { toJSONValue } from "../format"
import type { BaseDispatcherOptions, DispatcherExecuteMeta } from "./dispatcher-types"
import { prepareDispatchArgs } from "./dispatcher-types"

export function NewJSONDispatcher(
    send: (data: string, errorMeta?: Record<string, any>) => void,
    options?: BaseDispatcherOptions,
) {
    return () =>
        new (class JSONDispatcher extends DispatcherBase {
            constructor(send: SendMethod, options: BaseDispatcherOptions = {}) {
                super(send, options)
            }

            public dispatch(meta: DispatcherExecuteMeta, rawArgs: any[], errorMeta?: Record<string, any>): void {
                let { processedRawArgs, processedErrorMeta } = prepareDispatchArgs(
                    this.redactDataRegExp,
                    meta,
                    rawArgs,
                    errorMeta,
                )

                let obj: any = {}
                if (this.printTimestamp) {
                    obj.timestamp = this.formatTimestamp(meta.timestamp)
                }
                if (this.printLevel) {
                    obj.level = meta.level
                }
                obj.args = processedRawArgs.map((a: any) => toJSONValue(a))

                this.sendMethod(JSON.stringify(obj), processedErrorMeta)
            }

            public formatTimestamp(t: number) {
                return new Date(t).toISOString()
            }
        })(send, options)
}
