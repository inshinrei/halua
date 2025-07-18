import { Halua } from "./main"
import { NewWebBrowserConsoleHandler } from "./handlers/WebBrowserConsoleHandler"

export const halua = new Halua(NewWebBrowserConsoleHandler())
export type { Log, Handler } from "./handlers/types"
export type { HaluaLogger } from "./types"
export { Level } from "./handlers/types"
export { NewWebBrowserConsoleHandler }
export { NewJSONHandler } from "./handlers/JSONHandler"
export { NewTextHandler } from "./handlers/TextHandler"
