export function arrayed<T extends any>(v: undefined | T | Array<T>): Array<T> {
    return Array.isArray(v) ? v : typeof v === "undefined" ? [] : [v]
}
