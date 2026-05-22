import { describe, expect, test } from "vitest"

import { halua, NewTextHandler, Level } from "./index"

describe("Halua logger e2e usage", () => {
    test("create new instance for logging", () => {
        let captured: string[] = []

        let logger = halua.create(NewTextHandler((line) => {
            captured.push(line)
        }))

        logger.info("hello world", { foo: 42 })
        logger.warn("just a warning")

        expect(captured.length).toBe(2)
        expect(captured[0]).toMatch(/INFO hello world/)
        expect(captured[0]).toContain(`"foo": 42`)
        expect(captured[1]).toMatch(/WARN just a warning/)
    })

    test("create multiple instances", () => {
        let logs1: string[] = []
        let logs2: string[] = []

        let l1 = halua.create(NewTextHandler((line) => {
            logs1.push(line)
        }), { level: Level.Warn })

        let l2 = halua.create(NewTextHandler((line) => {
            logs2.push(line)
        }), { level: Level.Debug })

        l1.debug("should not appear in l1")
        l1.info("should not appear in l1")
        l1.warn("visible in l1")

        l2.debug("visible in l2")
        l2.info("visible in l2")

        expect(logs1.length).toBe(1)
        expect(logs1[0]).toMatch(/WARN visible in l1/)
        expect(logs2.length).toBe(2)
        expect(logs2[0]).toMatch(/DEBUG visible in l2/)
        expect(logs2[1]).toMatch(/INFO visible in l2/)
    })

    test("append args with With method", () => {
        let captured: string[] = []

        let logger = halua.create(NewTextHandler((line) => {
            captured.push(line)
        }))

        let reqLogger = logger.child("requestId", "abc-123", "user", 42)
        reqLogger.info("processing started")

        expect(captured.length).toBe(1)
        expect(captured[0]).toMatch(/INFO processing started/)
        expect(captured[0]).toContain("requestId abc-123 user 42")

        let stepLogger = reqLogger.child("step", "validate")
        stepLogger.warn("slow validation")

        expect(captured.length).toBe(2)
        expect(captured[1]).toMatch(/WARN slow validation/)
        expect(captured[1]).toContain("requestId abc-123 user 42 step validate")

        // .create({ withArgs: [] }) clears context inherited from parent/child
        let cleanLogger = reqLogger.create({ withArgs: [] })
        cleanLogger.info("no extra context")

        expect(captured.length).toBe(3)
        expect(captured[2]).toMatch(/INFO no extra context/)
        expect(captured[2]).not.toContain("requestId")
    })

    test("minor levels and custom majors (level arithmetic fix)", () => {
        let captured: string[] = []

        // use template to avoid string concat footgun
        let logger = halua.create(NewTextHandler((line) => { captured.push(line) }), {
            level: `${Level.Info}+2`
        })

        logger.logTo("INFO+1", "filtered low minor")
        logger.logTo("INFO+2", "borderline")
        logger.logTo("INFO+3", "high minor")
        logger.logTo("WARN", "higher major")
        logger.logTo("info+0", "low minor info")
        logger.logTo("CUSTOM+1", "diff major custom")

        let customCap: string[] = []
        let cLogger = halua.create(NewTextHandler((l) => customCap.push(l)), { level: "AUDIT+5" })
        cLogger.logTo("AUDIT+3", "audit low")
        cLogger.logTo("AUDIT+5", "audit ok")
        cLogger.logTo("AUDIT+10", "audit high")
        cLogger.logTo("INFO", "info not audit")

        // main logger (min INFO+2): only +2, +3, WARN (unknown majors like "INFO2" or "CUSTOM" are rejected)
        expect(captured.some((c) => c.includes("filtered low"))).toBe(false)
        expect(captured.some((c) => c.includes("borderline"))).toBe(true)
        expect(captured.some((c) => c.includes("high minor"))).toBe(true)
        expect(captured.some((c) => c.includes("higher major"))).toBe(true)
        expect(captured.some((c) => c.includes("low minor info"))).toBe(false)
        expect(captured.some((c) => c.includes("diff major custom"))).toBe(false)
        expect(captured.length).toBe(3)

        // custom AUDIT+5 handler: only same major with minor >=5
        expect(customCap.some((c) => c.includes("audit low"))).toBe(false)
        expect(customCap.some((c) => c.includes("audit ok"))).toBe(true)
        expect(customCap.some((c) => c.includes("audit high"))).toBe(true)
        expect(customCap.some((c) => c.includes("info not"))).toBe(false)
        expect(customCap.length).toBe(2)
    })
})
