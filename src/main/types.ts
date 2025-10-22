export type ArgumentType =
    | "undefined"
    | "null"
    | "boolean"
    | "string"
    | "number"
    | "array"
    | "object"
    | "symbol"
    | "typedarray"
    | "arraybuffer"
    | "bigint"
    | "map"
    | "set"
    | "weakmap"
    | "weakset"
    | "date"
    | "nan"
    | "infinity"
    | "function"
    | "error"

export interface Argument {
    type: ArgumentType
    value: any
}
