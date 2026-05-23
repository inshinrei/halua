import type { BaseDispatcherOptions, Dispatcher, DispatcherExecuteMeta } from "./dispatcher-types"
import { LogLevel } from "../../types/log"
import { toarray } from "../util/cast"
import { redact } from "../format"

export type SendMethod = (data: string, errorMeta?: Record<string, any>) => void

export class DispatcherBase implements Dispatcher {
    public sendMethod: SendMethod
    public formatArg: ((value: any) => any) | undefined = undefined

    public level: LogLevel | undefined
    public exact: Array<LogLevel> | null = null

    public printTimestamp: boolean = true
    public printLevel: boolean = true

    public redactDataRegExp?: RegExp

    _lastTimestampSec = -1
    _lastTimestampStr = ""

    constructor(send: SendMethod = () => {}, options: BaseDispatcherOptions = {}) {
        this.dispatch = this.dispatch.bind(this)
        this.sendMethod = send

        this.printTimestamp = options.printTimestamp ?? true
        this.printLevel = options.printLevel ?? true
        this.level = options.level
        this.exact = options.exact ? (toarray(options.exact) as Array<LogLevel>) : null
        this.redactDataRegExp = options.redactDataRegExp
    }

    public dispatch(meta: DispatcherExecuteMeta, args: any[], errorMeta?: Record<string, any>): void {
        let effectiveRe = this.redactDataRegExp || (meta as any).redactDataRegExp
        let processedArgs = effectiveRe ? args.map((v: any) => redact(v, effectiveRe)) : args
        let processedErrorMeta = errorMeta
        if (effectiveRe && errorMeta != null) {
            processedErrorMeta = redact(errorMeta, effectiveRe) as Record<string, any>
        }

        let parts: any[] = []

        if (this.printTimestamp) {
            parts.push(this.formatTimestamp(meta.timestamp))
        }

        if (this.printLevel) {
            parts.push(meta.level)
        }

        for (let value of processedArgs) {
            let formatted: any
            if (typeof this.formatArg === "function") {
                formatted = this.formatArg(value)
            } else {
                formatted = value
            }
            parts.push(formatted)
        }

        this.sendMethod(parts.join(" "), processedErrorMeta)
    }

    public formatTimestamp(t: number): string {
        let sec = Math.floor(t / 1000)
        if (sec === this._lastTimestampSec) {
            return this._lastTimestampStr
        }
        let d = new Date(t)
        let s = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
        this._lastTimestampSec = sec
        this._lastTimestampStr = s
        return s
    }
}
