import { Level } from "../../types/log"

export function extractLevels(level: unknown): [string, number] {
    if (typeof level !== "string") {
        return [Level.Info, 0]
    }
    let s = level.toUpperCase().trim()
    let data = s.split("+")
    let major: string
    let minor: number
    if (data.length >= 2) {
        major = data[0].trim() || Level.Info
        let n = Number(data[1].trim())
        minor = Number.isFinite(n) ? Math.trunc(n) : 0
    } else {
        major = s || Level.Info
        minor = 0
    }
    if (minor < 0) minor = 0
    return [major, minor]
}

export function printTimes(n: number, value: string) {
    if (n <= 0) {
        return ""
    }
    return value.repeat(n)
}
