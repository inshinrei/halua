import type { Log } from "../../lib"

export function stringMatchesVar(str: string, ignoredStrings: Set<string>): boolean {
    return !ignoredStrings.has(str) && str.trim().indexOf(" ") === -1
}

let messageFormatExcludes = new Set([" ", "%a", "%w", "%t", "%l"])

export function extractNonFormatChars(f: string): Set<string> {
    let total: Set<string> = new Set()
    for (let char of f) {
        if (!messageFormatExcludes.has(char)) {
            total.add(char)
        }
    }
    return total
}

export function extractTaken(f: string): Array<string> {
    let total: Array<string> = []
    let seq = ""
    for (let rune of f) {
        if (seq && (rune === "%" || rune === " ")) {
            total.push(seq)
            seq = ""
            if (rune === "%") {
                seq += rune
            }
            continue
        }
        seq += rune
    }

    if (seq) {
        total.push(seq)
    }

    return total
}

export function removeTailingUndefinedValues(format: string, log: Log) {
    if (!argsInDisposition(format) || log.withArgs) {
        return format
    }
    let argsIndex = format.indexOf("%a")
    let withArgsIndex = format.indexOf("%w")
    if (withArgsIndex < argsIndex) {
        return format
    }
    return format.slice(0, argsIndex + 2)
}

export function messageFormatPrettyCompatible(f: string): boolean {
    return argsInDisposition(f) || (f.indexOf("t") === -1 && f.indexOf("%l") === -1)
}

function argsInDisposition(format: string): boolean {
    let indexOfArgs = format.indexOf("%a")
    let indexOfWithArgs = format.indexOf("%w")
    let indexOfTimestamp = format.indexOf("%t")
    let indexOfLevel = format.indexOf("l")
    return Math.max(indexOfTimestamp, indexOfLevel) < Math.min(indexOfArgs, indexOfWithArgs)
}

export function getConvertStartingIndex(format: string): number {
    let sum = format.indexOf("%t") + format.indexOf("%l")
    if (sum === -2) {
        return 0
    }
    if (sum === 0) {
        return 1
    }
    return 2
}
