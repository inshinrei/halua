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
            expect(parseArg(a1)).toStrictEqual({
                bare: a1,
                parsed: a1,
            })
            expect(parseArg(a2)).toStrictEqual({ bare: a2, parsed: a2 })
            expect(parseArg(a3)).toStrictEqual({ bare: a3, parsed: a3 })
        })

        it("parses number", () => {
            let a1 = -25
            let a2 = 0
            let a3 = 5000
            expect(parseArg(a1)).toStrictEqual({ bare: a1, parsed: a1 })
            expect(parseArg(a2)).toStrictEqual({ bare: a2, parsed: a2 })
            expect(parseArg(a3)).toStrictEqual({ bare: a3, parsed: a3 })
        })

        it("parses undefined", () => {
            expect(parseArg(undefined)).toStrictEqual({ bare: undefined, parsed: undefined })
        })

        it("parses null", () => {
            expect(parseArg(null)).toStrictEqual({ bare: null, parsed: null })
        })

        it("parses bool", () => {
            expect(parseArg(true)).toStrictEqual({ bare: true, parsed: true })
            expect(parseArg(false)).toStrictEqual({ bare: false, parsed: false })
        })

        it("parses bigint", () => {})

        it("parses symbol", () => {})

        it("parses object", () => {})

        it("parses array", () => {})

        it("parses nested object", () => {})

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

        it("converts errors on parse to HaluaParseError", () => {})
    })
})
