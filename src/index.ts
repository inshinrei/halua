import { Halua } from "./main"
import { ConsoleHandler } from "./handlers/ConsoleHandler"

export const halua = new Halua(ConsoleHandler())
export type { Log, Handler } from "./handlers/types"
export { Level } from "./handlers/types"
export { ConsoleHandler }
export { JSONHandler } from "./handlers/JSONHandler"
export { TextHandler } from "./handlers/TextHandler"
