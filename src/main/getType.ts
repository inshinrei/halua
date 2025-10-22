import { type ArgumentType } from "./types"

export function getType(arg: any): ArgumentType {
    if (typeof arg === "undefined") {
        return "undefined"
    }
    if (typeof arg === "object" && String(arg) === "null") {
        return "null"
    }
    if (Array.isArray(arg)) {
        return "array"
    }
    if (ArrayBuffer.isView(arg)) {
        return "typedarray"
    }
    if (arg instanceof ArrayBuffer) {
        return "arraybuffer"
    }
    if (arg instanceof Map) {
        return "map"
    }
    if (arg instanceof Set) {
        return "set"
    }
    if (arg instanceof WeakMap) {
        return "weakmap"
    }
    if (arg instanceof WeakSet) {
        return "weakset"
    }
    if (arg instanceof Date) {
        return "date"
    }
    if (arg instanceof Error) {
        return "error"
    }
    if (Number.isNaN(arg)) {
        return "nan"
    }
    if (typeof arg === "number" && !Number.isFinite(arg)) {
        return "infinity"
    }
    return typeof arg as ArgumentType
}
