import { Halua } from "./main"
import { ConsoleHandler } from "./handlers/ConsoleHandler"

export const halua = new Halua(ConsoleHandler())
