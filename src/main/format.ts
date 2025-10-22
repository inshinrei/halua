import type { Argument, ArgumentType } from "./types"

const FormatAsIs: Array<ArgumentType> = [
    "undefined",
    "null",
    "string",
    "number",
    "boolean",
    "symbol",
    "typedarray",
    "bigint",
    "date",
    "nan",
    "infinity",
]
const FormatNeeded: Array<ArgumentType> = [
    "array",
    "object",
    "arraybuffer",
    "map",
    "set",
    "weakmap",
    "weakset",
    "function",
    "error",
]

export function format(arg: Argument) {
    if (FormatAsIs.some((f) => f === arg.type)) {
        return formatAsIs(arg.value, arg.type)
    }
    if (FormatNeeded.some((f) => f === arg.type)) {
        // return formatComplex(arg.value)
    }
    return arg.value
}

function formatAsIs(arg: any, type: ArgumentType) {
    if (type === "number") {
        return arg
    }
    if (type === "boolean") {
        return arg
    }
    return String(arg)
}

function formatComplex() {}
