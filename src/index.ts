import { NewConsoleDispatcher } from "./main/dispatchers/console-dispatcher"
import { NewConsoleColoredDispatcher } from "./main/dispatchers/console-colored-dispatcher"
import { createHalua } from "./main/create-halua"
import { spanFlow } from "./main/features/span-flow"

const logConsole: Console | null = (() => {
    try {
        return typeof self !== "undefined" ? self.console : console
    } catch (_) {
        return null
    }
})()

export const halua = createHalua()
    .dispatchers(logConsole ? NewConsoleDispatcher(logConsole) : [])
    .use(spanFlow())
    .build()

export type { Dispatcher, ConsoleLike } from "./main/dispatchers/dispatcher-types"
export type { HaluaLogger, Feature, SpanFlowApi, CaptureApi, CapturedRecord } from "./main/types"
export type { HaluaBuilder } from "./main/create-halua"

export { Level } from "./types/log"
export { NewConsoleDispatcher, NewConsoleColoredDispatcher }
export { NewJSONDispatcher } from "./main/dispatchers/json-dispatcher"
export { NewTextDispatcher } from "./main/dispatchers/text-dispatcher"
export { createHalua } from "./main/create-halua"
export { spanFlow } from "./main/features/span-flow"
export { capture } from "./main/features/capture"

export { DispatcherBase } from "./main/dispatchers/dispatcher-base"
export { format, toJSONValue, redact, DefaultRedactRegExp } from "./main/format"
export { getType } from "./main/get-type"
