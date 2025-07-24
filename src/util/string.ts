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
    return argsInDisposition(f)
}

function argsInDisposition(format: string): boolean {
    let indexOfArgs = format.indexOf("%a")
    let indexOfWithArgs = format.indexOf("%w")
    let indexOfTimestamp = format.indexOf("%t")
    let indexOfLevel = format.indexOf("l")
    return Math.max(indexOfTimestamp, indexOfLevel) < Math.min(indexOfArgs, indexOfWithArgs)
}
