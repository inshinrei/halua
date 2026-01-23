import { Halua } from "./main/halua"
import { NewConsoleHandler } from "./main/handlers/ConsoleHandler"

export const halua = new Halua(NewConsoleHandler(console))

export type { Handler } from "./main/handlers/types"
export type { HaluaLogger } from "./main/types"

export { Level } from "./types/log"
export { NewConsoleHandler }
export { NewJSONHandler } from "./main/handlers/JSONHandler"
export { NewTextHandler } from "./main/handlers/TextHandler"
