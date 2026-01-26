import { describe, expect, it } from "vitest"
import { format } from "./format"
import { HaluaParseError } from "./errors"

describe("format", () => {
    describe("formatting as is", () => {
        it("undefined", () => {
            expect(format({ type: "undefined", value: undefined })).toEqual("undefined")
        })

        it("null", () => {
            expect(format({ type: "null", value: null })).toEqual("null")
        })

        it("string", () => {
            expect(format({ type: "string", value: "str" })).toEqual("str")
        })

        it("number", () => {
            expect(format({ type: "number", value: 5254 })).toEqual(5254)
        })

        it("symbol", () => {
            expect(format({ type: "symbol", value: Symbol("A") })).toEqual("Symbol(A)")
        })

        it("typedarray", () => {
            let i1 = BigInt(9007199254740991)
            expect(format({ type: "typedarray", value: new BigInt64Array([i1]) })).toEqual("9007199254740991")
        })

        it("bigint", () => {
            expect(format({ type: "bigint", value: BigInt(9007199254740991) })).toEqual("9007199254740991")
        })

        it("date", () => {
            expect(
                format({
                    type: "date",
                    value: new Date("2020-01-01"),
                }),
            ).toEqual("Wed Jan 01 2020 00:00:00 GMT+0000 (Coordinated Universal Time)")
        })

        it("boolean", () => {
            expect(format({ type: "boolean", value: false })).toEqual(false)
        })

        it("nan", () => {
            expect(format({ type: "nan", value: NaN })).toEqual("NaN")
        })

        it("infinity", () => {
            expect(format({ type: "infinity", value: -Infinity })).toEqual("-Infinity")
        })
    })

    describe("formatting complex values", () => {
        it("array", () => {
            expect(format({ type: "array", value: [1, 2, 3, 4, 5] })).toEqual("[1, 2, 3, 4, 5]")
            expect(format({ type: "array", value: ["s1", "s2", "s3"] })).toEqual(`["s1", "s2", "s3"]`)
            expect(format({ type: "array", value: [false, true] })).toEqual("[false, true]")
        })

        it("array of mixed types", () => {
            expect(
                format({
                    type: "array",
                    value: [1, "str", { prop: "s2" }],
                }),
            ).toEqual(`[1, "str", {\n\t"prop": "s2"\n}]`)
        })

        it("array buffer", () => {
            expect(format({ type: "arraybuffer", value: new ArrayBuffer() })).toEqual(`ArrayBuffer []`)
        })

        it("object", () => {
            expect(format({ type: "object", value: { prop: "value", num: 1 } })).toEqual(
                `{\n\t"prop": "value",\n\t"num": 1\n}`,
            )
        })

        it("nested object", () => {
            expect(
                format({
                    type: "object",
                    value: {
                        prop: "value",
                        nested: {
                            type: "some",
                            thing: {
                                next: "value",
                            },
                        },
                    },
                }),
            ).toEqual(
                `{\n\t"prop": "value",\n\t"nested": {\n\t\t"type": "some",\n\t\t"thing": {\n\t\t\t"next": "value"\n\t\t}\n\t}\n}`,
            )
        })

        it("map", () => {
            expect(
                format({
                    type: "map",
                    value: new Map<string, any>([
                        ["key1", 1],
                        ["key2", "str"],
                    ]),
                }),
            ).toEqual(`{\n\t"key1" => 1,\n\t"key2" => "str"\n}`)
        })

        it("map of mixed types", () => {
            expect(
                format({
                    type: "map",
                    value: new Map<string | number, any>([
                        ["key1", { prop: "value" }],
                        [1, [1, 2, 3]],
                    ]),
                }),
            ).toEqual(`{\n\t"1" => "[1, 2, 3]",\n\t"key1" => "{\n\t"prop": "value"\n}"\n}`)
        })

        it("set", () => {
            expect(format({ type: "set", value: new Set([1, 2, 3, 4]) })).toEqual(`Set[1, 2, 3, 4]`)
        })

        it("weakmap", () => {
            expect(format({ type: "weakmap", value: new WeakMap() })).toEqual("WeakMap {inaccessible}")
        })

        it("weakset", () => {
            expect(format({ type: "weakset", value: new WeakSet() })).toEqual("WeakSet [inaccessible]")
        })

        it("function", () => {
            function name() {
                return "keka"
            }

            expect(format({ type: "function", value: name })).toEqual(`Function name`)
            expect(
                format({
                    type: "function",
                    value: () => {},
                }),
            ).toEqual(`Function anonymous`)
        })

        it("error", () => {
            expect(format({ type: "error", value: new Error("test message") })).toContain(`Error: test message`)
            expect(
                format({
                    type: "error",
                    value: new HaluaParseError("test"),
                }),
            ).toContain(`Error: HaluaParseError: test`)
        })
    })
})
