import { Halua } from "./main/halua"
import { NewConsoleDispatcher } from "./main/dispatchers/ConsoleDispatcher"

const logConsole: Console | null = (() => {
    try {
        return typeof self !== "undefined" ? self.console : console
    } catch (_) {
        return null
    }
})()

export const halua = new Halua(logConsole ? NewConsoleDispatcher(logConsole) : [])

export type { Dispatcher } from "./main/dispatchers/DispatcherTypes"
export type { HaluaLogger } from "./main/types"

export { Level } from "./types/log"
export { NewConsoleDispatcher }
export { NewJSONDispatcher } from "./main/dispatchers/JSONDispatcher"
export { NewTextDispatcher } from "./main/dispatchers/TextDispatcher"

export { DispatcherBase } from "./main/dispatchers/DispatcherBase"
export { format, toJSONValue, redact, DefaultRedactRegExp } from "./main/format"
export { getType } from "./main/getType"
