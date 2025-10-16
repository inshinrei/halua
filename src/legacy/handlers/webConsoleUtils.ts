import { Level } from "./types"

export function getColorKey(level: Level): ColorKey {
    return {
        [Level.Trace]: "grey",
        [Level.Debug]: "purple",
        [Level.Info]: "blue",
        [Level.Warn]: "orange",
        [Level.Notice]: "orange",
        [Level.Error]: "red",
        [Level.Fatal]: "red",
    }[level] as ColorKey
}

export type ColorKey = "grey" | "green" | "blue" | "purple" | "orange" | "red"
export type Colors = Map<ColorKey, string>
