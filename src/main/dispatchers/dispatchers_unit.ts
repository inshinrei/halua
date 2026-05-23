import { describe, expect, it } from "vitest"
import { NewTextDispatcher } from "./TextDispatcher"
import { NewJSONDispatcher } from "./JSONDispatcher"
import { NewConsoleDispatcher } from "./ConsoleDispatcher"
import type { DispatcherExecuteMeta } from "./DispatcherTypes"
import { Level } from "../../types/log"
import { DefaultRedactRegExp } from "../format"

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

describe("dispatcher redact support", () => {
    const baseMeta: DispatcherExecuteMeta = { timestamp: Date.now(), level: Level.Info }

    it("NewTextDispatcher redacts using its own redactDataRegExp option", () => {
        let received: string | undefined
        const re = /password|secret/i
        const d = NewTextDispatcher((line) => {
            received = line
        }, { redactDataRegExp: re })()

        d.dispatch(baseMeta, ["user password is hunter2", { secret: "s3cr3t", safe: 1 }])

        expect(received).toContain("^_^")
        expect(received).toContain("secret")
        expect(received).toContain("^_^")
        // "hunter2" remains because re only matches labels, not the secret value itself
        expect(received).not.toContain("s3cr3t")
    })

    it("NewJSONDispatcher redacts args and forwards redacted errorMeta", () => {
        let receivedJson: string | undefined
        let receivedMeta: any
        const re = /token/i
        const d = NewJSONDispatcher((json, meta) => {
            receivedJson = json
            receivedMeta = meta
        }, { redactDataRegExp: re })()

        d.dispatch(baseMeta, [{ apiToken: "t123", ok: true }], { authToken: "bearer xyz", other: "data" })

        let parsed = JSON.parse(receivedJson!)
        expect(parsed.args[0]).toEqual({ apiToken: "^_^", ok: true })
        expect(receivedMeta).toEqual({ authToken: "^_^", other: "data" })
    })

    it("redact from meta (main instance) is used when dispatcher has none", () => {
        let received: string | undefined
        const re = /email/i
        const metaWithRe: DispatcherExecuteMeta = { ...baseMeta, redactDataRegExp: re }
        const d = NewTextDispatcher((line) => {
            received = line
        })()

        d.dispatch(metaWithRe, ["contact email here", { contactEmail: "x@y.com" }])

        expect(received).toContain("^_^")
        expect(received).not.toContain("email")
        expect(received).not.toContain("x@y.com")
    })

    it("dispatcher-level redact overrides meta redact", () => {
        let received: string | undefined
        const metaRe = /email/i
        const dispatchRe = /secret/i
        const metaWith: DispatcherExecuteMeta = { ...baseMeta, redactDataRegExp: metaRe }
        const d = NewTextDispatcher((line) => {
            received = line
        }, { redactDataRegExp: dispatchRe })()

        d.dispatch(metaWith, ["secret data and email a@b.com"])

        // only secret redacted by dispatch override, email not
        expect(received).toContain("^_^ data")
        expect(received).toContain("email a@b.com")
    })
})
