import { DispatcherBase, SendMethod } from "./DispatcherBase"
import { toJSONValue } from "../format"
import type { BaseDispatcherOptions, DispatcherExecuteMeta } from "./DispatcherTypes"

export function NewJSONDispatcher(
    send: (data: string, errorMeta?: Record<string, any>) => void,
    options?: BaseDispatcherOptions,
) {
    return () =>
        new (class JSONDispatcher extends DispatcherBase {
            constructor(send: SendMethod, options: BaseDispatcherOptions = {}) {
                super(send, options)
            }

            public dispatch(meta: DispatcherExecuteMeta, args: any[], errorMeta?: Record<string, any>): void {
                let obj: any = {}
                if (this.printTimestamp) {
                    obj.timestamp = this.formatTimestamp(meta.timestamp)
                }
                if (this.printLevel) {
                    obj.level = meta.level
                }
                obj.args = args.map((a: any) => toJSONValue(a))

                this.sendMethod(JSON.stringify(obj), errorMeta)
            }

            public formatTimestamp(t: number) {
                return new Date(t).toISOString()
            }
        })(send, options)
}
