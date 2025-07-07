import { Halua } from "./main"
import { WebBrowserConsoleHandler } from "./handlers/WebBrowserConsoleHandler"

export const halua = new Halua(WebBrowserConsoleHandler())
export type { Log, Handler } from "./handlers/types"
export type { HaluaLogger } from "./types"
export { Level } from "./handlers/types"
export { WebBrowserConsoleHandler }
export { JSONHandler } from "./handlers/JSONHandler"
export { TextHandler } from "./handlers/TextHandler"
