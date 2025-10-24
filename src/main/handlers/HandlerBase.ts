import type { Handler, NextMessage, YieldMessage } from "./types"

export class HandlerBase implements Handler {
    formatArg = undefined

    constructor(private send: (value: string) => {}) {
        this.execute = this.execute.bind(this)
    }

    *execute(): Generator<YieldMessage, void, NextMessage> {
        let arg = ""
        let current: NextMessage = { value: null, type: "init" }
        while (current.type !== "done") {
            if (current.type === "init") {
                yield { type: "init" }
            }

            if (current.prev) {
                arg += current.prev
            }
            
            if (current.type === "arg") {
                if (typeof this.formatArg === "function") {
                    arg += (this.formatArg as Function)(current.value)
                    current = yield { type: "done" }
                }
            }

            current = yield { type: "pass" }
        }

        if (current.prev) {
            arg += current.prev
        }
        this.send(arg)
    }
}
