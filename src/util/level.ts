import { Level } from "../handlers/types"
import type { HandlerField } from "../types"

export function toLevel(v: HandlerField): Level {
    return {
        trace: Level.Trace,
        debug: Level.Debug,
        info: Level.Info,
        warn: Level.Warn,
        notice: Level.Notice,
        error: Level.Error,
        fatal: Level.Fatal,
        assert: Level.Error,
    }[v]
}
