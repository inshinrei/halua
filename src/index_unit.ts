import { describe, expect, test } from "vitest"

import { halua, NewTextDispatcher, NewJSONDispatcher, NewConsoleDispatcher, Level } from "./index"

describe("Halua logger e2e usage", () => {
    test("create new instance for logging", () => {
        let captured: string[] = []

        let logger = halua.create(
            NewTextDispatcher((line) => {
                captured.push(line)
            }),
        )

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

        let l1 = halua.create(
            NewTextDispatcher((line) => {
                logs1.push(line)
            }),
            { level: Level.Warn },
        )

        let l2 = halua.create(
            NewTextDispatcher((line) => {
                logs2.push(line)
            }),
            { level: Level.Debug },
        )

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

        let logger = halua.create(
            NewTextDispatcher((line) => {
                captured.push(line)
            }),
        )

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
        let logger = halua.create(
            NewTextDispatcher((line) => {
                captured.push(line)
            }),
            {
                level: `${Level.Info}+2`,
            },
        )

        logger.logTo("INFO+1", "filtered low minor")
        logger.logTo("INFO+2", "borderline")
        logger.logTo("INFO+3", "high minor")
        logger.logTo("WARN", "higher major")
        logger.logTo("info+0", "low minor info")
        logger.logTo("CUSTOM+1", "diff major custom")

        let customCap: string[] = []
        let cLogger = halua.create(
            NewTextDispatcher((l) => customCap.push(l)),
            { level: "AUDIT+5" },
        )
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

        // custom AUDIT+5 dispatcher: only same major with minor >=5
        expect(customCap.some((c) => c.includes("audit low"))).toBe(false)
        expect(customCap.some((c) => c.includes("audit ok"))).toBe(true)
        expect(customCap.some((c) => c.includes("audit high"))).toBe(true)
        expect(customCap.some((c) => c.includes("info not"))).toBe(false)
        expect(customCap.length).toBe(2)
    })

    test("NewJSONDispatcher produces valid structured JSON output", () => {
        let captured: string[] = []

        let logger = halua.create(
            NewJSONDispatcher((line) => {
                captured.push(line)
            }),
        )

        logger.info("json test", { foo: 42 }, [1, 2])

        expect(captured.length).toBe(1)
        let parsed = JSON.parse(captured[0])
        expect(parsed).toHaveProperty("timestamp")
        expect(parsed.level).toBe("INFO")
        expect(parsed.args).toEqual(["json test", { foo: 42 }, [1, 2]])
    })

    test("NewJSONDispatcher respects printTimestamp and printLevel options", () => {
        let captured: string[] = []

        let logger = halua.create(
            NewJSONDispatcher((line) => captured.push(line), {
                printTimestamp: false,
                printLevel: false,
            }),
        )

        logger.warn("no meta")

        let parsed = JSON.parse(captured[0])
        expect(parsed).not.toHaveProperty("timestamp")
        expect(parsed).not.toHaveProperty("level")
        expect(parsed.args).toEqual(["no meta"])
    })

    test("NewConsoleDispatcher routes levels to correct methods and passes raw values", () => {
        let calls: Array<{ method: string; args: any[] }> = []

        let mock = {
            debug: (...a: any[]) => {
                calls.push({ method: "debug", args: a })
            },
            info: (...a: any[]) => {
                calls.push({ method: "info", args: a })
            },
            warn: (...a: any[]) => {
                calls.push({ method: "warn", args: a })
            },
            error: (...a: any[]) => {
                calls.push({ method: "error", args: a })
            },
        }

        let logger = halua.create(NewConsoleDispatcher(mock))

        logger.debug("d", { x: 1 })
        logger.info("i", 123)
        logger.warn("w")
        logger.error(new Error("boom"))

        expect(calls.length).toBe(4)
        expect(calls[0].method).toBe("debug")
        expect(calls[0].args.some((a: any) => typeof a === "string" && a.includes("DEBUG"))).toBe(true)
        expect(calls[0].args.some((a: any) => a && a.x === 1)).toBe(true)
        expect(calls[1].method).toBe("info")
        expect(calls[2].method).toBe("warn")
        expect(calls[3].method).toBe("error")
    })

    test("create accepts array of dispatchers for multi-dispatcher dispatch via Balancer", () => {
        let text: string[] = []
        let json: string[] = []

        let tH = NewTextDispatcher((l) => text.push(l))
        let jH = NewJSONDispatcher((l) => json.push(l))

        let logger = halua.create([tH, jH])

        logger.notice("multi dispatch")

        expect(text.length).toBe(1)
        expect(json.length).toBe(1)
        expect(text[0]).toMatch(/NOTICE multi dispatch/)
        expect(JSON.parse(json[0]).args).toContain("multi dispatch")
    })

    test("setDispatchers replaces and appendDispatchers augments the active dispatcher set", () => {
        let c1: string[] = []
        let c2: string[] = []
        let c3: string[] = []

        let logger = halua.create(NewTextDispatcher((l) => c1.push(l)))
        logger.info("first")
        expect(c1.length).toBe(1)

        logger.setDispatchers(NewTextDispatcher((l) => c2.push(l)))
        logger.info("second")
        expect(c1.length).toBe(1)
        expect(c2.length).toBe(1)

        logger.appendDispatchers(NewTextDispatcher((l) => c3.push(l)))
        logger.warn("third")
        expect(c2.length).toBe(2)
        expect(c3.length).toBe(1)
    })

    test("exact option on individual dispatcher bypasses parent level filter", () => {
        let exactCap: string[] = []
        let normalCap: string[] = []

        let exactH = NewTextDispatcher((l) => exactCap.push(l), { exact: Level.Error })
        let normalH = NewTextDispatcher((l) => normalCap.push(l))

        let logger = halua.create([exactH, normalH], { level: Level.Info })

        logger.debug("filtered for normal")
        logger.info("visible to normal")
        logger.error("visible to both")

        expect(normalCap.length).toBe(2)
        expect(exactCap.length).toBe(1)
        expect(exactCap[0]).toMatch(/ERROR visible to both/)
    })

    test("assert only emits on false condition at ERROR level", () => {
        let cap: string[] = []

        let logger = halua.create(NewTextDispatcher((l) => cap.push(l)))

        logger.assert(true, "should not appear")
        logger.assert(false, "assert failed", 99)
        logger.assert(1 === 1, "also skipped")

        expect(cap.length).toBe(1)
        expect(cap[0]).toMatch(/ERROR assert failed/)
        expect(cap[0]).toContain("99")
    })

    test("throwing dispatcher is isolated; does not throw to caller and siblings still execute", () => {
        let good: string[] = []
        let goodH = NewTextDispatcher((l) => good.push(l))

        let badFactory = () => {
            let h: any = {
                dispatch: () => {
                    throw new Error("intentional bad dispatcher")
                },
                exact: null,
                level: undefined,
            }
            return h
        }

        let logger = halua.create([goodH, badFactory])

        let didThrow = false
        try {
            logger.info("reaches good dispatcher")
        } catch (e) {
            didThrow = true
        }

        expect(didThrow).toBe(false)
        expect(good.length).toBe(1)
        expect(good[0]).toMatch(/INFO reaches good dispatcher/)
    })

    test("stamp and stampEnd log pretty duration diffs using performance.now", () => {
        let captured: string[] = []

        let logger = halua.create(
            NewTextDispatcher((line) => {
                captured.push(line)
            }),
        )

        // returned ender fn
        let end1 = logger.stamp("sync work")
        end1()

        expect(captured.length).toBe(1)
        expect(captured[0]).toMatch(/INFO sync work took \d+\.\d{2}ms/)

        // named id + stampEnd
        let end2 = logger.stamp("db query", "q1")
        logger.stampEnd("q1")

        expect(captured.length).toBe(2)
        expect(captured[1]).toMatch(/INFO db query took \d+\.\d{2}ms/)

        // unknown id does nothing
        logger.stampEnd("nope")
        expect(captured.length).toBe(2)

        // child context is carried in stamp log
        let req = logger.child("reqId", "abc-9")
        let endReq = req.stamp("child op", "c1")
        endReq()
        expect(captured.length).toBe(3)
        expect(captured[2]).toMatch(/INFO child op took \d+\.\d{2}ms/)
        expect(captured[2]).toContain("reqId abc-9")

        // ender is idempotent
        end1()
        expect(captured.length).toBe(3)
    })
})
