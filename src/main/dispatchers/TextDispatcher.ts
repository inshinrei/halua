import { DispatcherBase, SendMethod } from "./DispatcherBase"
import { format } from "../format"
import { getType } from "../getType"
import type { BaseDispatcherOptions } from "./DispatcherTypes"

export function NewTextDispatcher(
    send: (data: string, errorMeta?: Record<string, any>) => void,
    options?: BaseDispatcherOptions,
) {
    return () =>
        new (class TextDispatcher extends DispatcherBase {
            constructor(send: SendMethod, options: BaseDispatcherOptions = {}) {
                super(send, options)

                this.formatArg = (value: any) => format({ type: getType(value), value }, options.spacing)
            }
        })(send, options)
}
