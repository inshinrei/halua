import { Level } from "../handlers/types"

export function toLevel(v: "debug" | "info" | "warn" | "error" | "assert"): Level {
    return {
        debug: Level.Debug,
        info: Level.Info,
        warn: Level.Warn,
        error: Level.Error,
        assert: Level.Error,
    }[v]
}
