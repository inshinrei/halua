import { replaceDataBeforeStringify } from "./dataReplacer"

export function stringifyValue(value: any): string {
    if (typeof value === "symbol") {
        return value.toString()
    }

    if (value instanceof Set) {
        return `Set[${Array.from(value)}]`
    }

    if (Array.isArray(value)) {
        return `[${value}]`
    }

    if (typeof value === "string") {
        return `${value}`
    }

    return JSON.stringify(value, (_, data: any) => replaceDataBeforeStringify(data))
}
