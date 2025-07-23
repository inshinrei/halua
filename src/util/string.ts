export function stringMatchesVar(str: string, ignoredStrings: Array<string>): boolean {
    return !ignoredStrings.some((s) => s === str) && str.trim().indexOf(" ") === -1
}
