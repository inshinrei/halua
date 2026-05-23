import { describe, expect, it } from "vitest"
import { NewTextDispatcher } from "./TextDispatcher"
import { NewJSONDispatcher } from "./JSONDispatcher"
import type { DispatcherExecuteMeta } from "./DispatcherTypes"
import { Level } from "../../types/log"

describe("dispatcher errorMeta support", () => {
    const baseMeta: DispatcherExecuteMeta = {
        timestamp: Date.now(),
        level: Level.Error,
    }

    describe("NewTextDispatcher", () => {
        it("forwards errorMeta as the second argument to the send callback", () => {
            let receivedLine: string | undefined
            let receivedErrorMeta: any

            const d = NewTextDispatcher((line, errorMeta) => {
                receivedLine = line
                receivedErrorMeta = errorMeta
            })()

            d.dispatch(baseMeta, [new Error("payment failed")], { issueKey: "PAY-987", userId: 42 })

            expect(receivedLine).toMatch(/ERROR Error: payment failed/)
            expect(receivedErrorMeta).toEqual({ issueKey: "PAY-987", userId: 42 })
        })

        it("passes undefined as second argument when no errorMeta is provided", () => {
            let receivedErrorMeta: any = "SENTINEL"

            const d = NewTextDispatcher((line, errorMeta) => {
                receivedErrorMeta = errorMeta
            })()

            d.dispatch(baseMeta, [new Error("plain error")])

            expect(receivedErrorMeta).toBeUndefined()
        })
    })

    describe("NewJSONDispatcher", () => {
        it("forwards errorMeta as the second argument to the send callback", () => {
            let receivedJson: string | undefined
            let receivedErrorMeta: any

            const d = NewJSONDispatcher((json, errorMeta) => {
                receivedJson = json
                receivedErrorMeta = errorMeta
            })()

            d.dispatch(baseMeta, [new Error("db timeout")], { issueKey: "DB-123", retry: true })

            expect(receivedJson).toContain("db timeout")
            expect(receivedErrorMeta).toEqual({ issueKey: "DB-123", retry: true })
        })

        it("passes undefined when errorMeta is absent", () => {
            let receivedErrorMeta: any = "SENTINEL"

            const d = NewJSONDispatcher((json, errorMeta) => {
                receivedErrorMeta = errorMeta
            })()

            d.dispatch(baseMeta, [new Error("no context")])

            expect(receivedErrorMeta).toBeUndefined()
        })
    })
})
