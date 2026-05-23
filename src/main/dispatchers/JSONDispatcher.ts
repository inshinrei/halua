import { DispatcherBase, SendMethod } from "./DispatcherBase"
import { redact, toJSONValue } from "../format"
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
                let effectiveRe = this.redactDataRegExp || (meta as any).redactDataRegExp
                let processedArgs = effectiveRe ? args.map((a: any) => redact(a, effectiveRe)) : args
                let processedErrorMeta = errorMeta
                if (effectiveRe && errorMeta != null) {
                    processedErrorMeta = redact(errorMeta, effectiveRe) as Record<string, any>
                }

                let obj: any = {}
                if (this.printTimestamp) {
                    obj.timestamp = this.formatTimestamp(meta.timestamp)
                }
                if (this.printLevel) {
                    obj.level = meta.level
                }
                obj.args = processedArgs.map((a: any) => toJSONValue(a))

                this.sendMethod(JSON.stringify(obj), processedErrorMeta)
            }

            public formatTimestamp(t: number) {
                return new Date(t).toISOString()
            }
        })(send, options)
}
