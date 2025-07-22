import { Halua } from "./main"
import { NewWebConsoleHandler } from "./handlers/WebConsoleHandler"

export const halua = new Halua(NewWebConsoleHandler())
export type { Log, Handler } from "./handlers/types"
export type { HaluaLogger } from "./types"
export { Level } from "./handlers/types"
export { NewWebConsoleHandler }
export { NewJSONHandler } from "./handlers/JSONHandler"
export { NewTextHandler } from "./handlers/TextHandler"
