import type { Argument, ArgumentType } from "./types"
import { EmptySpacing, Spacing } from "../util/spacing"
import { HaluaParseError } from "../util/errors"
import { getType } from "./getType"
import { printTimes } from "../util/string"

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

export function format(arg: Argument, spacing: boolean = true): string {
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

export function formatJSON(arg: Argument) {
    if (arg.type === "error") {
        return `${arg.value.toString()} stack: ${arg.value.stack?.replace("\n", "")}`
    }
    return format(arg, false)
}

function formatAsIs(arg: any, type: ArgumentType): string {
    if (type === "number") {
        return arg
    }
    if (type === "boolean") {
        return arg
    }
    return String(arg)
}

function formatComplex(
    arg: any,
    type: ArgumentType,
    spacing: typeof Spacing | typeof EmptySpacing,
    nestingLevel = 1,
): string {
    if (type === "set") {
        return `Set${formatArray(convertSetToArray(arg), spacing)}`
    }
    if (type === "weakset") {
        return `WeakSet \[inaccessible\]`
    }
    if (type === "weakmap") {
        return `WeakMap \{inaccessible\}`
    }
    if (type === "function") {
        let name = arg.name
        return `Function ${name === "value" ? "anonymous" : name}`
    }
    if (type === "array") {
        return formatArray(arg, spacing)
    }
    if (type === "arraybuffer") {
        return `ArrayBuffer \[\]`
    }
    if (type === "map") {
        return formatObject(convertMapToObj(arg), spacing, nestingLevel, ` => `)
    }
    if (type === "error") {
        return `${arg.toString()} stack: ${arg.stack}`
    }
    if (type === "object") {
        return formatObject(arg, spacing, nestingLevel)
    }

    return arg
}

function formatArray(arg: Array<any>, spacing: typeof Spacing | typeof EmptySpacing): string {
    let stringify = "\["
    let len = arg.length
    for (let entry of arg) {
        len -= 1

        let entryType = getType(entry)
        let formatted = format({ type: entryType, value: entry })
        let entryValue = entryType === "string" ? `\"${formatted}\"` : formatted
        stringify += `${entryValue}${len ? `,${spacing.Space}` : spacing.Empty}`
    }
    stringify += "\]"
    return stringify
}

function formatObject(
    arg: any,
    spacing: typeof Spacing | typeof EmptySpacing,
    nestingLevel = 1,
    delimiter = `: `,
): string {
    let stringify = `\{${spacing.Line}`
    let len = Object.keys(arg).length
    for (let key in arg) {
        len -= 1

        let entryType = getType(arg[key])
        let formatted =
            entryType === "object"
                ? formatComplex(arg[key], entryType, spacing, nestingLevel + 1)
                : format({
                      type: entryType,
                      value: arg[key],
                  })
        let entryValue = entryType === "string" ? `\"${formatted}\"` : formatted
        stringify += `${printTimes(nestingLevel, spacing.Tab)}\"${key}\"${delimiter}${entryValue}${len ? `,${spacing.Line}` : spacing.Empty}`
    }

    let level = nestingLevel - 1
    stringify += `${spacing.Line}${printTimes(level, spacing.Tab)}\}`
    return stringify
}

function convertMapToObj(value: Map<any, any>): Record<any, any> {
    let obj: Record<string, any> = {}
    for (let [key, v] of value) {
        let keyType = getType(key)
        let objKey: string = keyType === "string" ? key : format({ type: keyType, value: key })

        let valueType = getType(v)
        obj[objKey] = format({ type: valueType, value: v })
    }
    return obj
}

function convertSetToArray(value: Set<any>): Array<any> {
    let arr: Array<any> = []
    for (let entry of value) {
        arr.push(entry)
    }
    return arr
}
