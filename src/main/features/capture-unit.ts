import { describe, expect, test } from "vitest"

import { createHalua } from "../create-halua"
import { capture } from "./capture"
import { spanFlow } from "./span-flow"
import { NewTextDispatcher } from "../dispatchers/text-dispatcher"
import { Level } from "../../types/log"

describe("capture", () => {
    test("collect() records raw dispatch args including withArgs suffix", () => {
        let logger = createHalua()
            .dispatchers(NewTextDispatcher(() => {}))
            .use(capture())
            .build()
        logger.child("flow", "checkout").info("start", { orderId: 1 })
        let recs = logger.collect()
        expect(recs.length).toBe(1)
        expect(recs[0].level).toBe("INFO")
        expect(recs[0].args[0]).toBe("start")
        expect(recs[0].args[1]).toEqual({ orderId: 1 })
        expect(recs[0].args.slice(-2)).toEqual(["flow", "checkout"])
        expect(typeof recs[0].timestamp).toBe("number")
    })

    test("children share the same buffer; clear() empties it", () => {
        let logger = createHalua().use(capture()).use(spanFlow()).build()
        let child = logger.flow("checkout")
        child.info("start")
        expect(logger.collect().length).toBe(1)
        expect(child.collect().length).toBe(1)
        child.clear()
        expect(logger.collect().length).toBe(0)
    })

    test("collect() returns a copy", () => {
        let logger = createHalua().use(capture()).build()
        logger.info("a")
        let a = logger.collect()
        a.push({ timestamp: 0, level: "INFO", args: ["forged"] })
        expect(logger.collect().length).toBe(1)
    })

    test("disabled levels are not captured", () => {
        let logger = createHalua().use(capture()).level(Level.Error).build()
        logger.info("hidden")
        logger.error(new Error("boom"), { k: 1 })
        let recs = logger.collect()
        expect(recs.length).toBe(1)
        expect(recs[0].level).toBe("ERROR")
        expect(recs[0].errorMeta?.k).toBe(1)
        expect(recs[0].errorMeta?.error).toBeInstanceOf(Error)
    })

    test("setDispatchers keeps capture working", () => {
        let lines: string[] = []
        let logger = createHalua()
            .dispatchers(NewTextDispatcher((l) => lines.push(l)))
            .use(capture())
            .build()
        logger.setDispatchers(NewTextDispatcher((l) => lines.push(l)))
        logger.info("still")
        expect(logger.collect().some((r) => r.args[0] === "still")).toBe(true)
    })
})
