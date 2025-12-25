import type { Handler, NextMessage, YieldMessage } from "./types"
import { LogLevel } from "../../types/log"

export type SendMethod = (data: string) => void

export class HandlerBase implements Handler {
    public sendMethod: SendMethod
    public formatArg: ((value: any) => any) | undefined = undefined

    public level: LogLevel = "TRACE"
    public exact: Array<LogLevel> = []

    public printTimestamp: boolean = true
    public printLevel: boolean = true

    constructor(send?: SendMethod) {
        this.execute = this.execute.bind(this)
        this.sendMethod = send ?? (() => {})
    }

    public *execute(meta: { timestamp: number; level: string }): Generator<YieldMessage, void, NextMessage> {
        let arg = ""
        let current: NextMessage = { value: null, type: "init" }

        if (this.printTimestamp) {
            arg += `${this.formatTimestamp(meta.timestamp)}`
        }

        if (this.printLevel) {
            arg += ` ${meta.level} `
        }

        while (true) {
            if (current.type === "init") {
                current = yield { type: "init" }
            }

            if (current.prev) {
                arg += " " + current.prev
            }

            if (current.type === "done") {
                break
            }

            if (current.type === "arg") {
                if (typeof this.formatArg === "function") {
                    arg += " " + this.formatArg(current.value)
                    current = yield { type: "done" }
                    continue
                }
            }

            current = yield { type: "pass" }
        }

        this.sendMethod(arg.trimStart())
    }

    public formatTimestamp(t: number): string {
        let d = new Date(t)
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    }
}
