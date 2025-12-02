import type { Handler, NextMessage, YieldMessage } from "./types"

export type SendMethod = (data: string) => void

export class HandlerBase implements Handler {
    sendMethod: SendMethod
    formatArg: ((value: any) => any) | undefined = undefined

    constructor(send: SendMethod) {
        this.execute = this.execute.bind(this)
        this.sendMethod = send
    }

    *execute(): Generator<YieldMessage, void, NextMessage> {
        let arg = ""
        let current: NextMessage = { value: null, type: "init" }

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
}
