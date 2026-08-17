import { describe, expect, test, vi } from "vitest"

import { createHalua } from "../create-halua"
import { spanFlow } from "./span-flow"
import { NewTextDispatcher } from "../dispatchers/text-dispatcher"
import { NewJSONDispatcher } from "../dispatchers/json-dispatcher"

function make() {
    let lines: string[] = []
    let records: any[] = []
    let logger = createHalua()
        .dispatchers([
            NewTextDispatcher((line) => lines.push(line)),
            NewJSONDispatcher((json) => records.push(JSON.parse(json))),
        ])
        .use(spanFlow())
        .build()
    return { logger, lines, records }
}

function makeRaw() {
    let raw: Array<{ args: any[]; errorMeta?: any; level: string }> = []
    let rawFactory = () => ({
        level: undefined,
        exact: null,
        dispatch(meta: any, args: any[], errorMeta?: any) {
            raw.push({ level: meta.level, args, errorMeta })
        },
    })
    let logger = createHalua().dispatchers(rawFactory).use(spanFlow()).build()
    return { logger, raw }
}

describe("spanFlow", () => {
    test("flow() appends flow <name> and flattened ctx; does not log", () => {
        let { logger, lines, records } = make()
        let log = logger.flow("checkout", { requestId: "r1", userId: 7 })
        expect(lines.length).toBe(0)
        log.info("start", { orderId: 1 })
        expect(lines[0]).toContain("flow checkout")
        expect(lines[0]).toContain("requestId r1")
        expect(lines[0]).toContain("userId 7")
        expect(records[0].args.slice(-6)).toEqual(["flow", "checkout", "requestId", "r1", "userId", 7])
    })

    test("flow() without ctx is just the mark pair", () => {
        let { logger, lines } = make()
        logger.flow("checkout").info("start")
        expect(lines[0]).toContain("flow checkout")
        expect(lines[0]).not.toContain("requestId")
    })

    test("span(label, fn) logs start/done with elapsedMs and span mark; returns fn value", () => {
        let now = 1000
        let spy = vi.spyOn(performance, "now").mockImplementation(() => now)
        let { logger, lines, records } = make()
        now = 1000
        let value = logger.flow("checkout").span("charge", (s) => {
            s.info("using gateway")
            now = 1012.5
            return 42
        })
        expect(value).toBe(42)
        expect(lines.some((l) => l.includes("using gateway") && l.includes("span charge"))).toBe(true)
        let startRec = records.find((r) => r.args[0] === "start" && r.args[1]?.span === "charge")
        let doneRec = records.find((r) => r.args[0] === "done" && r.args[1]?.span === "charge")
        expect(startRec).toBeTruthy()
        expect(doneRec.args[1].elapsedMs).toBeCloseTo(12.5, 4)
        expect(lines.some((l) => l.includes("took"))).toBe(false)
        spy.mockRestore()
    })

    test("span(label, async fn) waits and still closes", async () => {
        let { logger, records } = make()
        let value = await logger.span("charge", async () => {
            return "ok"
        })
        expect(value).toBe("ok")
        expect(records.some((r) => r.args[0] === "done")).toBe(true)
    })

    test("span callback Error is logged with .error and rethrown", () => {
        let { logger, raw } = makeRaw()
        let boom = new Error("nope")
        expect(() =>
            logger.span("charge", () => {
                throw boom
            }),
        ).toThrow(boom)
        let errRec = raw.find((r) => r.level === "ERROR")
        expect(errRec).toBeTruthy()
        expect(errRec!.args[0]).toBeInstanceOf(Error)
        expect(errRec!.args[0].message).toBe("nope")
        expect(errRec!.errorMeta?.span).toBe("charge")
        expect(typeof errRec!.errorMeta?.elapsedMs).toBe("number")
    })

    test("span callback non-Error is never-happen warn and rethrown", () => {
        let { logger, raw } = makeRaw()
        expect(() =>
            logger.span("charge", () => {
                throw "bad"
            }),
        ).toThrow("bad")
        let rec = raw.find((r) => r.args[0] === "never-happen")
        expect(rec).toBeTruthy()
        expect(rec!.level).toBe("WARN")
        expect(rec!.args[1].err).toBe("bad")
        expect(rec!.args[1].span).toBe("charge")
    })

    test("rejected thenable is a failure chapter and rejects", async () => {
        let { logger, raw } = makeRaw()
        let boom = new Error("async fail")
        await expect(logger.span("charge", () => Promise.reject(boom))).rejects.toBe(boom)
        expect(raw.some((r) => r.level === "ERROR")).toBe(true)
        expect(raw.some((r) => r.args[0] === "done")).toBe(false)
    })

    test("ender form is idempotent and returns elapsed ms", () => {
        let now = 50
        let spy = vi.spyOn(performance, "now").mockImplementation(() => now)
        let { logger, records } = make()
        now = 50
        let end = logger.span("charge")
        now = 80
        expect(end()).toBeCloseTo(30, 4)
        expect(end()).toBeCloseTo(30, 4)
        expect(records.filter((r) => r.args[0] === "done").length).toBe(1)
        spy.mockRestore()
    })

    test("nested span keeps the parent flow mark", () => {
        let { logger, lines } = make()
        logger.flow("checkout").span("charge", (s) => {
            s.info("mid")
        })
        let mid = lines.find((l) => l.includes("mid"))
        expect(mid).toContain("flow checkout")
        expect(mid).toContain("span charge")
    })
})
