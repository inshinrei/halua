import { replaceDataBeforeStringify } from "./dataReplacer"

export function stringifyValue(
    value: any,
    stringifier: (v: any, replacer: (key: string, value: any) => any) => string = JSON.stringify,
): string {
    if (typeof value === "symbol") {
        return value.toString()
    }

    if (value instanceof Set) {
        return `Set[${Array.from(value)}]`
    }

    if (value instanceof Error) {
        return value.toString()
    }

    if (Array.isArray(value)) {
        return `[${value}]`
    }

    if (typeof value === "string") {
        return `${value}`
    }

    return stringifier(value, (_, data: any) => replaceDataBeforeStringify(data))
}
