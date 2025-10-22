import { describe, expect, it } from "vitest"
import { parseArg } from "./args"

describe("args module", () => {
    describe("makeArgsGenerator", () => {
        it("makes a generator", () => {})
    })

    describe("argsgen", () => {
        it("iterates over every argument, yield parseArg func", () => {})
    })

    describe("parseArg", () => {
        it("parses string", () => {
            let a1 = ""
            let a2 = "check chapter"
            let a3 = "🤓"
            expect(parseArg(a1)).toStrictEqual({ bare: a1, parsed: a1, type: "string" })
            expect(parseArg(a2)).toStrictEqual({ bare: a2, parsed: a2, type: "string" })
            expect(parseArg(a3)).toStrictEqual({ bare: a3, parsed: a3, type: "string" })
        })

        it("parses number", () => {
            let a1 = -25
            let a2 = 0
            let a3 = 5000
            expect(parseArg(a1)).toStrictEqual({ bare: a1, parsed: a1, type: "number" })
            expect(parseArg(a2)).toStrictEqual({ bare: a2, parsed: a2, type: "number" })
            expect(parseArg(a3)).toStrictEqual({ bare: a3, parsed: a3, type: "number" })
        })

        it("parses undefined", () => {
            expect(parseArg(undefined)).toStrictEqual({ bare: undefined, parsed: undefined, type: "undefined" })
        })

        it("parses null", () => {
            expect(parseArg(null)).toStrictEqual({ bare: null, parsed: null, type: "null" })
        })

        it("parses bool", () => {
            expect(parseArg(true)).toStrictEqual({ bare: true, parsed: true, type: "boolean" })
            expect(parseArg(false)).toStrictEqual({ bare: false, parsed: false, type: "boolean" })
        })

        it("parses bigint", () => {
            let bigint = BigInt(9007199254740991)
            expect(parseArg(bigint)).toStrictEqual({
                bare: bigint,
                parsed: bigint,
                type: "bigint",
            })
        })

        it("parses symbol", () => {
            let symbol = Symbol("A")
            expect(parseArg(symbol)).toStrictEqual({ bare: symbol, parsed: "Symbol(A)", type: "symbol" })
        })

        it("parses object", () => {
            let o = {
                value: "string",
                type: "object",
            }
            expect(parseArg(o)).toStrictEqual({
                bare: o,
                parsed: `{\n"value": "string",\n"type": "object"\n}`,
                type: "object",
            })
        })

        it("parses array", () => {
            let a = ["string", 1, null]
            expect(parseArg(a)).toStrictEqual({
                bare: a,
                parsed: `["string", 1, null]`,
                type: "array",
            })
        })

        it("parses typed array", () => {
            let a = new Int32Array([21, 31])
            expect(parseArg(a)).toStrictEqual({
                bare: a,
                parsed: `TypedArray[21, 31]`,
                type: "typedarray",
            })
        })

        it("parses nested object", () => {
            let o = {
                value: "string",
                nested: {
                    prop: 1,
                    nestedType: {
                        type: "array",
                    },
                },
            }
            /**
             * {
             * "value": "string",
             * "nested": "{
             * "prop": "1",
             * "nestedType": "{
             * "type": "array"
             * }"
             * }"
             * }
             *
             * {
             *     "value": "string",
             *     "nested": {
             *         "prop": 1,
             *         "nestedType": {
             *             "type": "array"
             *         }
             *     }
             * }
             * */
            console.log(parseArg(o).parsed)
            expect(parseArg(o)).toStrictEqual({
                bare: o,
                parsed: `{\n"value": "string",\n"nested": "{\n"prop": "number",\n"nestedType": "{\n"type": "array"\n}"\n}"\n}`,
                type: "object",
            })
        })

        it("parses array of objects", () => {})

        it("parses error class", () => {})

        it("parses custom class with toString check", () => {})

        it("parses Map", () => {})

        it("parses Set", () => {})

        it("parses WeakMap", () => {})

        it("parsesWeakSet", () => {})

        it("parses Date", () => {})

        it("parses NaN", () => {})

        it("parses Infinity", () => {})

        it("parses Function", () => {})

        it("converts errors on parse to HaluaParseError", () => {})
    })
})
