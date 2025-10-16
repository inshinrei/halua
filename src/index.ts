import { Halua } from "./legacy/main"
import { NewWebConsoleHandler } from "./legacy/handlers/WebConsoleHandler"

export const halua = new Halua(NewWebConsoleHandler())

export type { Log, Handler } from "./legacy/handlers/types"
export type { HaluaLogger } from "./legacy/types"

export { Level } from "./legacy/handlers/types"
export { NewWebConsoleHandler }
export { NewJSONHandler } from "./legacy/handlers/JSONHandler"
export { NewTextHandler } from "./legacy/handlers/TextHandler"
