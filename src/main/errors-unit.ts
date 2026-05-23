import { describe, expect, it } from "vitest"
import { unknownToError } from "./errors"

describe("unknownToError", () => {
    it("returns the same Error instance when input is already Error", () => {
        let original = new Error("boom")
        let result = unknownToError(original)
        expect(result).toBe(original)
        expect(result.message).toBe("boom")
    })

    it("wraps string input in a new Error with that message", () => {
        let result = unknownToError("something went wrong")
        expect(result).toBeInstanceOf(Error)
        expect(result.message).toBe("something went wrong")
    })

    it("serializes non-string non-Error via JSON.stringify and sets cause", () => {
        let input = { code: 42, reason: "timeout" }
        let result = unknownToError(input)
        expect(result).toBeInstanceOf(Error)
        expect(result.message).toBe('{"code":42,"reason":"timeout"}')
        expect(result.cause).toBe(input)
    })

    it("handles primitives like numbers and booleans via stringify", () => {
        let num = unknownToError(404)
        expect(num.message).toBe("404")
        expect(num.cause).toBe(404)

        let bool = unknownToError(false)
        expect(bool.message).toBe("false")
        expect(bool.cause).toBe(false)
    })

    it("handles null and undefined via stringify", () => {
        let n = unknownToError(null)
        expect(n.message).toBe("null")
        expect(n.cause).toBe(null)

        let u = unknownToError(undefined)
        expect(u.message).toBe("")
        expect(u.cause).toBe(undefined)
    })

    it("produces empty message string and preserves cause on stringify failure (circular)", () => {
        let circ: any = { a: 1 }
        circ.self = circ
        let result = unknownToError(circ)
        expect(result).toBeInstanceOf(Error)
        expect(result.message).toBe("")
        expect(result.cause).toBe(circ)
    })

    it("handles arrays and complex objects", () => {
        let arr = [1, "x", { y: 2 }]
        let result = unknownToError(arr)
        expect(result.message).toBe('[1,"x",{"y":2}]')
        expect(result.cause).toBe(arr)
    })
})
