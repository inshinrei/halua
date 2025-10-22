import { describe, expect, it } from "vitest"
import { getType } from "./getType"

describe("getType", () => {
    it("gets undefined type", () => {
        expect(getType(undefined)).toEqual("undefined")
    })

    it("gets null type", () => {
        expect(getType(null)).toEqual("null")
    })

    it("gets string type", () => {
        expect(getType("str")).toEqual("string")
    })

    it("gets number type", () => {
        expect(getType(12)).toEqual("number")
    })

    it("gets array type", () => {
        expect(getType([1, 2, 3])).toEqual("array")
    })

    it("gets object type", () => {
        expect(getType({})).toEqual("object")
    })

    it("gets symbol type", () => {
        expect(getType(Symbol("A"))).toEqual("symbol")
    })

    it("gets typedarray type", () => {
        expect(getType(new BigInt64Array([]))).toEqual("typedarray")
    })

    it("gets arraybuffer type", () => {
        expect(getType(new ArrayBuffer())).toEqual("arraybuffer")
    })

    it("gets bigint type", () => {
        expect(getType(BigInt(9007199254740991))).toEqual("bigint")
    })

    it("gets map type", () => {
        expect(getType(new Map())).toEqual("map")
    })

    it("gets set type", () => {
        expect(getType(new Set())).toEqual("set")
    })

    it("gets weakmap type", () => {
        expect(getType(new WeakMap())).toEqual("weakmap")
    })

    it("gets weakset type", () => {
        expect(getType(new WeakSet())).toEqual("weakset")
    })

    it("gets date type", () => {
        expect(getType(new Date())).toEqual("date")
    })

    it("gets nan type", () => {
        expect(getType(NaN)).toEqual("nan")
    })

    it("gets infinity type", () => {
        expect(getType(Infinity)).toEqual("infinity")
    })

    it("gets function type", () => {
        function a() {}

        expect(getType(a)).toEqual("function")
        expect(getType(() => {})).toEqual("function")
    })

    it("gets error type", () => {
        expect(getType(new Error())).toEqual("error")
    })
})
