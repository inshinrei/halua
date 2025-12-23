export function toarray<T>(value: T): Array<T> {
    return Array.isArray(value) ? value : [value]
}
