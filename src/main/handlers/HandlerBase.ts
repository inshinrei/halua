import type { Handler, HandlerExecuteMeta } from "./types"
import { LogLevel } from "../../types/log"

export type SendMethod = (data: string) => void

export class HandlerBase implements Handler {
    public sendMethod: SendMethod
    public formatArg: ((value: any) => any) | undefined = undefined

    public level: LogLevel | undefined
    public exact: Array<LogLevel> | null = null

    public printTimestamp: boolean = true
    public printLevel: boolean = true

    _lastTimestampSec = -1
    _lastTimestampStr = ""

    constructor(send?: SendMethod) {
        this.dispatch = this.dispatch.bind(this)
        this.sendMethod = send ?? (() => {})
    }

    public dispatch(meta: HandlerExecuteMeta, args: any[]): void {
        let parts: any[] = []

        if (this.printTimestamp) {
            parts.push(this.formatTimestamp(meta.timestamp))
        }

        if (this.printLevel) {
            parts.push(meta.level)
        }

        for (let value of args) {
            let formatted: any
            if (typeof this.formatArg === "function") {
                formatted = this.formatArg(value)
            } else {
                formatted = value
            }
            parts.push(formatted)
        }

        this.sendMethod(parts.join(" "))
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
