import type { Argument, ArgumentType } from "./types"
import { EmptySpacing, Spacing } from "./util/spacing"
import { HaluaParse } from "./errors"
import { getType } from "./getType"
import { printTimes } from "./util/string"

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
        let seen = new WeakSet<object>()
        if (FormatAsIs.some((f) => f === arg.type)) {
            return formatAsIs(arg.value, arg.type)
        }
        if (FormatNeeded.some((f) => f === arg.type)) {
            return formatComplex(arg.value, arg.type, SpacingEnum, 1, seen)
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

function formatValue(value: any, spacing: typeof Spacing | typeof EmptySpacing, seen: WeakSet<object>): any {
    let type = getType(value)
    if (FormatAsIs.some((f) => f === type)) {
        return formatAsIs(value, type)
    }
    if (FormatNeeded.some((f) => f === type)) {
        return formatComplex(value, type, spacing, 1, seen)
    }
    return value
}

function formatComplex(
    arg: any,
    type: ArgumentType,
    spacing: typeof Spacing | typeof EmptySpacing,
    nestingLevel = 1,
    seen: WeakSet<object>,
): string {
    if (type === "set") {
        if (seen.has(arg)) {
            return "[Circular]"
        }
        seen.add(arg)
        let r = `Set${formatArray(convertSetToArray(arg), spacing, seen)}`
        seen.delete(arg)
        return r
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
        if (seen.has(arg)) {
            return "[Circular]"
        }
        seen.add(arg)
        let r = formatArray(arg, spacing, seen)
        seen.delete(arg)
        return r
    }
    if (type === "arraybuffer") {
        return `ArrayBuffer \[\]`
    }
    if (type === "map") {
        if (seen.has(arg)) {
            return "[Circular]"
        }
        seen.add(arg)
        let r = formatObject(convertMapToObj(arg, spacing, seen), spacing, nestingLevel, ` => `, seen)
        seen.delete(arg)
        return r
    }
    if (type === "error") {
        return `${arg.toString()} stack: ${arg.stack}`
    }
    if (type === "object") {
        if (seen.has(arg)) {
            return "[Circular]"
        }
        seen.add(arg)
        let r = formatObject(arg, spacing, nestingLevel, `: `, seen)
        seen.delete(arg)
        return r
    }

    return arg
}

function formatArray(arg: Array<any>, spacing: typeof Spacing | typeof EmptySpacing, seen: WeakSet<object>): string {
    let items: any[] = []
    for (let entry of arg) {
        let entryType = getType(entry)
        let formatted = formatValue(entry, spacing, seen)
        let entryValue = entryType === "string" ? `\"${formatted}\"` : formatted
        items.push(entryValue)
    }
    let sep = `,${spacing.Space}`
    return `[${items.join(sep)}]`
}

function formatObject(
    arg: any,
    spacing: typeof Spacing | typeof EmptySpacing,
    nestingLevel = 1,
    delimiter = `: `,
    seen: WeakSet<object>,
): string {
    let keys = Object.keys(arg)
    let kvParts: any[] = []
    for (let key of keys) {
        let val = arg[key]
        let entryType = getType(val)
        let formatted =
            entryType === "object"
                ? formatComplex(val, entryType, spacing, nestingLevel + 1, seen)
                : formatValue(val, spacing, seen)
        let entryValue = entryType === "string" ? `\"${formatted}\"` : formatted
        kvParts.push(`${printTimes(nestingLevel, spacing.Tab)}\"${key}\"${delimiter}${entryValue}`)
    }

    let body = kvParts.join(`,${spacing.Line}`)
    let level = nestingLevel - 1
    let closeIndent = printTimes(level, spacing.Tab)
    return `\{${spacing.Line}${kvParts.length ? body + spacing.Line : ""}${closeIndent}\}`
}

function convertMapToObj(
    value: Map<any, any>,
    spacing: typeof Spacing | typeof EmptySpacing,
    seen: WeakSet<object>,
): Record<any, any> {
    let obj: Record<string, any> = {}
    for (let [key, v] of value) {
        let keyType = getType(key)
        let objKey: any = keyType === "string" ? key : formatValue(key, spacing, seen)
        obj[objKey] = formatValue(v, spacing, seen)
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

const REDACTION_TOKEN = "^_^"

/**
 * Default RegExp for redacting sensitive data in logs.
 * Matches common sensitive key names (e.g. password, apiKey, token, email, ssn)
 * via substring (for camelCase/snake_case keys) and common sensitive value patterns
 * (JWTs, emails, SSNs, credit cards, bearer tokens).
 * Use with `redactDataRegExp` option on loggers or dispatchers.
 */
export const DefaultRedactRegExp =
    /pass(?:word|wd)?|secret|token|api[_-]?key|access[_-]?token|auth(?:orization)?|private[_-]?key|credential|session(?:[_-]?id)?|cookie|ssn|social[_-]?sec(?:urity)?|credit[_-]?card|cc[_-]?num(?:ber)?|cvv|cvc|pin|email|phone|mobile|tel|bearer|eyJ[0-9a-zA-Z_-]{10,}\.[0-9a-zA-Z_-]{10,}|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b|\b(?:\d[ -]*){13,16}\b/i

/**
 * Recursively redacts sensitive data from a value according to regexp.
 * - Strings (and strings inside arrays): matched substrings replaced by "^_^"
 * - Objects/Maps: if *key* matches regexp, the corresponding value is replaced by "^_^" entirely
 * - Handles circulars safely (returns "[Circular]")
 * - Also redacts inside Error messages
 * - Other types passed through
 */
export function redact(value: any, regexp?: RegExp): any {
    if (!regexp) {
        return value
    }
    return redactRec(value, regexp, new WeakSet<object>())
}

function redactRec(value: any, re: RegExp, seen: WeakSet<object>): any {
    if (value == null) {
        return value
    }
    let type = getType(value)
    if (type === "string") {
        return redactString(value, re)
    }
    if (type === "array") {
        if (seen.has(value)) {
            return "[Circular]"
        }
        seen.add(value)
        let result: any[] = []
        for (let entry of value) {
            result.push(redactRec(entry, re, seen))
        }
        seen.delete(value)
        return result
    }
    if (type === "object") {
        if (seen.has(value)) {
            return "[Circular]"
        }
        seen.add(value)
        let result: any = {}
        for (let key of Object.keys(value)) {
            let k = key
            re.lastIndex = 0
            if (re.test(k)) {
                result[k] = REDACTION_TOKEN
            } else {
                result[k] = redactRec(value[k], re, seen)
            }
        }
        seen.delete(value)
        return result
    }
    if (type === "map") {
        if (seen.has(value)) {
            return "[Circular]"
        }
        seen.add(value)
        let result = new Map()
        for (let [k, v] of value as Map<any, any>) {
            let keyStr = typeof k === "string" ? k : String(k ?? "")
            re.lastIndex = 0
            if (re.test(keyStr)) {
                result.set(k, REDACTION_TOKEN)
            } else {
                result.set(k, redactRec(v, re, seen))
            }
        }
        seen.delete(value)
        return result
    }
    if (type === "set") {
        if (seen.has(value)) {
            return "[Circular]"
        }
        seen.add(value)
        let result = new Set()
        for (let item of value as Set<any>) {
            result.add(redactRec(item, re, seen))
        }
        seen.delete(value)
        return result
    }
    if (type === "error") {
        let msg = (value as any).message
        if (typeof msg === "string") {
            msg = redactString(msg, re)
        }
        let Ctor = (value as any).constructor || Error
        let redacted: any
        try {
            redacted = new Ctor(msg)
            if ((value as any).name) {
                redacted.name = (value as any).name
            }
            if ((value as any).stack) {
                redacted.stack = (value as any).stack
            }
        } catch (_) {
            redacted = value
        }
        return redacted
    }
    return value
}

function redactString(str: string, re: RegExp): string {
    if (!re || typeof str !== "string") {
        return str
    }
    let flags = re.flags || ""
    if (!flags.includes("g")) {
        flags = flags + "g"
    }
    let searchRe: RegExp
    try {
        searchRe = new RegExp(re.source, flags)
    } catch (_) {
        return str
    }
    searchRe.lastIndex = 0
    let result = ""
    let last = 0
    let match: RegExpExecArray | null
    while ((match = searchRe.exec(str)) !== null) {
        let matchEnd = searchRe.lastIndex
        let replacement = REDACTION_TOKEN
        let newLast = matchEnd

        // Smart assignment redaction: if the matched sensitive key (e.g. "token", "password")
        // is immediately followed by "=" or ":" (common in "KEY=VALUE" or "key: secret" log lines),
        // also redact the value after the operator. This makes simple user regexps much more effective.
        let tail = str.slice(matchEnd)
        let assign = tail.match(/^(\s*[=:]\s*)(".*?"|'.*?'|\S+)?/)

        if (assign) {
            newLast = matchEnd + assign[0].length
            replacement = REDACTION_TOKEN
            // Tell the global search regex to resume *after* the extended region we just swallowed
            searchRe.lastIndex = newLast
        }

        result += str.slice(last, match.index) + replacement
        last = newLast
    }
    result += str.slice(last)
    return result
}
