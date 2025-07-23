export function stringMatchesVar(str: string, ignoredStrings: Array<string>): boolean {
    return !ignoredStrings.some((s) => s === str) && str.trim().indexOf(" ") === -1
}

export function extractSeparatorFromMessageFormat(f: string): string {
    return f.slice(f.indexOf("%a") + 3, f.indexOf("%w") - 1)
}
