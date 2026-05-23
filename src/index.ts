import { Halua } from "./main/halua"
import { NewConsoleDispatcher } from "./main/dispatchers/console-dispatcher"
import { NewConsoleColoredDispatcher } from "./main/dispatchers/console-colored-dispatcher"

const logConsole: Console | null = (() => {
    try {
        return typeof self !== "undefined" ? self.console : console
    } catch (_) {
        return null
    }
})()

export const halua = new Halua(logConsole ? NewConsoleDispatcher(logConsole) : [])

export type { Dispatcher, ConsoleLike } from "./main/dispatchers/dispatcher-types"
export type { HaluaLogger } from "./main/types"

export { Level } from "./types/log"
export { NewConsoleDispatcher, NewConsoleColoredDispatcher }
export { NewJSONDispatcher } from "./main/dispatchers/json-dispatcher"
export { NewTextDispatcher } from "./main/dispatchers/text-dispatcher"

export { DispatcherBase } from "./main/dispatchers/dispatcher-base"
export { format, toJSONValue, redact, DefaultRedactRegExp } from "./main/format"
export { getType } from "./main/get-type"
