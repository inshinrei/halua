import { Halua } from "./main"
import { NewWebBrowserConsoleHandler } from "./handlers/NewWebBrowserConsoleHandler"

export const halua = new Halua(NewWebBrowserConsoleHandler())
export type { Log, Handler } from "./handlers/types"
export type { HaluaLogger } from "./types"
export { Level } from "./handlers/types"
export { NewWebBrowserConsoleHandler }
export { NewJSONHandler } from "./handlers/NewJSONHandler"
export { NewTextHandler } from "./handlers/NewTextHandler"
