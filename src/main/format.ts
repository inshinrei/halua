import type { Argument, ArgumentType } from "./types"
import { EmptySpacing, Spacing } from "../util/spacing"
import { HaluaParse } from "./errors"
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
        let SpacingEnum = spacing ? Spacing : EmptySpacing
        if (FormatAsIs.some((f) => f === arg.type)) {
            return formatAsIs(arg.value, arg.type)
        }
        if (FormatNeeded.some((f) => f === arg.type)) {
            return formatComplex(arg.value, arg.type, SpacingEnum)
        }
    } catch (err) {
        return new HaluaParse((err as Error)?.message || "").message
    }
    return arg.value
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

export function toJSONValue(value: any): any {
    return convertToJSONValue(value, new WeakSet<object>())
}

function convertToJSONValue(value: any, seen: WeakSet<object>): any {
    if (value == null) {
        return null
    }
    let type = getType(value)
    if (type === "boolean" || type === "number" || type === "string") {
        return value
    }
    if (type === "symbol" || type === "function" || type === "bigint") {
        return value.toString()
    }
    if (type === "date") {
        return value.toISOString()
    }
    if (type === "nan" || type === "infinity") {
        return String(value)
    }
    if (type === "error") {
        let stack = value.stack ? value.stack.split(/\r?\n/) : []
        return { name: value.name || "Error", message: value.message || "", stack }
    }
    if (type === "weakmap" || type === "weakset") {
        return `[${type} inaccessible]`
    }
    if (type === "arraybuffer") {
        return { __type: "ArrayBuffer", byteLength: value.byteLength }
    }
    if (type === "typedarray") {
        return Array.from(value)
    }
    if (type === "array" || type === "object" || type === "map" || type === "set") {
        if (seen.has(value)) {
            return { __circular: true }
        }
        seen.add(value)
        let result: any
        if (type === "array") {
            result = value.map((item: any) => convertToJSONValue(item, seen))
        } else if (type === "object") {
            result = {}
            for (let key of Object.keys(value)) {
                result[key] = convertToJSONValue(value[key], seen)
            }
        } else if (type === "map") {
            result = {}
            for (let [k, v] of value as Map<any, any>) {
                let jk = convertToJSONValue(k, seen)
                let keyStr = typeof jk === "string" ? jk : String(jk ?? "")
                result[keyStr] = convertToJSONValue(v, seen)
            }
        } else if (type === "set") {
            result = Array.from(value as Set<any>, (item: any) => convertToJSONValue(item, seen))
        }
        seen.delete(value)
        return result
    }
    return String(value)
}
