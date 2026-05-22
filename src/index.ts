import { Halua } from "./main/halua"
import { NewConsoleHandler } from "./main/handlers/ConsoleHandler"

let logConsole: Console | null = null
try {
    logConsole = typeof self !== "undefined" ? self.console : console
} catch (_) {}

export const halua = new Halua(logConsole ? NewConsoleHandler(logConsole) : [])

export type { Handler } from "./main/handlers/types"
export type { HaluaLogger } from "./main/types"

export { Level } from "./types/log"
export { NewConsoleHandler }
export { NewJSONHandler } from "./main/handlers/JSONHandler"
export { NewTextHandler } from "./main/handlers/TextHandler"

export { HandlerBase } from "./main/handlers/HandlerBase"
export { format, toJSONValue } from "./main/format"
export { getType } from "./main/getType"
