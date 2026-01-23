import { Level } from "../../types/log"

export function extractLevels(level: unknown): [Level, number] {
    if (typeof level !== "string") {
        return [Level.Info, 0]
    }
    let data: Array<Level | string | number> = level.split("+")
    if (data.length !== 2) {
        let levels = [Level.Trace, Level.Debug, Level.Info, Level.Warn, Level.Notice, Level.Error, Level.Fatal]
        for (let l of levels) {
            if (level.includes(l)) {
                return [l, Math.trunc(level.split(l)[1] as any)]
            }
        }
    }
    return [data[0] as Level, Math.trunc(data[1] as number) || 0]
}
