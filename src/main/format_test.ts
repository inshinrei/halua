import { describe, expect, it } from "vitest"
import { format } from "./format"

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

        it("array of mixed types", () => {})

        it("array buffer", () => {})

        it("object", () => {
            expect(format({ type: "object", value: { prop: "value", num: 1 } })).toEqual(
                `{\n\tprop: "value",\n\tnum: 1\n}`,
            )
        })

        it("nested object", () => {})

        it("map", () => {})

        it("map of mixed types", () => {})

        it("set", () => {})

        it("weakmap", () => {})

        it("weakset", () => {})

        it("function", () => {})

        it("error", () => {})
    })
})
