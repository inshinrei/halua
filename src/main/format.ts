import type { Argument, ArgumentType } from "./types"
import { EmptySpacing, Spacing } from "../util/spacing"
import { HaluaParseError } from "../util/errors"
import { getType } from "./getType"

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

export function format(arg: Argument, spacing: boolean = true) {
    try {
        const SpacingEnum = spacing ? Spacing : EmptySpacing
        if (FormatAsIs.some((f) => f === arg.type)) {
            return formatAsIs(arg.value, arg.type)
        }
        if (FormatNeeded.some((f) => f === arg.type)) {
            return formatComplex(arg.value, arg.type, SpacingEnum)
        }
    } catch (err) {
        return new HaluaParseError((err as Error)?.message || "").message
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

function formatComplex(arg: any, type: ArgumentType, spacing: typeof Spacing | typeof EmptySpacing) {
    if (type === "array") {
        return formatArray(arg, spacing)
    }
    return arg
}

function formatArray(arg: Array<any>, spacing: typeof Spacing | typeof EmptySpacing): string {
    let stringify = "["
    let len = arg.length
    for (let entry of arg) {
        len -= 1

        let entryType = getType(entry)
        let entryValue = entryType === "string" ? `"${entry}"` : entry
        stringify += `${entryValue}${len ? `,${spacing.Space}` : ""}`
    }
    stringify += "]"
    return stringify
}
