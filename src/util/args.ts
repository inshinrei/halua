import { HaluaParseError } from "./errors"

export function makeArgsGenerator(...args: any[]) {
    return argsgen(parseArg, ...args)
}

export function* argsgen(parser, ...args: any[]) {
    for (let a of args) {
        yield parser(a)
    }
}

type ArgumentType = "symbol" | "null" | "array" | "typedarray" | "arraybuffer" | "object" | "string" | "number"

export function parseArg<T extends any>(value: T): { bare: T; parsed: any; type: ArgumentType } {
    try {
        if (typeof value === "symbol") {
            return { bare: value, parsed: value.toString(), type: "symbol" }
        }
        if (typeof value === "object" && String(value) === "null") {
            return { bare: value, parsed: null, type: "null" }
        }
        if (Array.isArray(value)) {
            return { bare: value, parsed: unpackArray(value), type: "array" }
        }
        if (ArrayBuffer.isView(value)) {
            return { bare: value, parsed: unpackArray(value as any[], "TypedArray"), type: "typedarray" }
        }
        if (value instanceof ArrayBuffer) {
            return { bare: value, parsed: unpackArray(value as any[], "ArrayBuffer"), type: "arraybuffer" }
        }
        if (typeof value === "object") {
            return { bare: value, parsed: unpackObject(value), type: "object" }
        }
    } catch (error) {
        return { bare: value, parsed: new HaluaParseError((error as Error)?.message).message }
    }
    return { bare: value, parsed: value, type: typeof value as ArgumentType }
}

export function unpackObject<T extends any>(value: T): string {
    let stringify = `{\n`
    let keysLen = Object.keys(value as object).length
    for (let key in value) {
        keysLen -= 1
        stringify += `"${key}": "${parseArg(value[key]).parsed}"${keysLen ? ",\n" : ""}`
    }
    stringify += `\n}`
    return stringify
}

export function unpackArray<T extends Array<any>>(arr: T, prefix: string | null = null) {
    let stringify = `${prefix ? prefix : ""}[`
    let len = arr.length ? arr.length : Infinity
    for (let v of arr) {
        len -= 1
        if (typeof v === "string") {
            stringify += `"${v}"${len ? ", " : ""}`
            continue
        }
        stringify += `${parseArg(v).parsed}${len ? ", " : ""}`
    }
    stringify += `]`
    return stringify
}

export function extractConstructorName(value: string) {
    return value.slice(value.indexOf(" "), value.length)
}
