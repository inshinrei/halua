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
