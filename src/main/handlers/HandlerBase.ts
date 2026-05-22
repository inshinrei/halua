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

    constructor(send?: SendMethod) {
        this.dispatch = this.dispatch.bind(this)
        this.sendMethod = send ?? (() => {})
    }

    public dispatch(meta: HandlerExecuteMeta, args: any[]): void {
        let arg = ""

        if (this.printTimestamp) {
            arg += `${this.formatTimestamp(meta.timestamp)}`
        }

        if (this.printLevel) {
            arg += `  ${meta.level}`
        }

        for (let value of args) {
            let formatted: any
            if (typeof this.formatArg === "function") {
                formatted = this.formatArg(value)
            } else {
                formatted = value
            }
            arg += ` ${formatted}`
        }

        this.sendMethod(arg.trimStart())
    }

    public formatTimestamp(t: number): string {
        let d = new Date(t)
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    }
}
