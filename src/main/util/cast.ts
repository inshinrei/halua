export function toarray<T extends any>(value: undefined | T | Array<T>): Array<T> {
    return Array.isArray(value) ? value : typeof value === "undefined" ? [] : [value]
}
