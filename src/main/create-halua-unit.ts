import { describe, expect, test } from "vitest"

import { createHalua } from "./create-halua"
import { NewTextDispatcher } from "./dispatchers/text-dispatcher"
import { Level } from "../types/log"
import type { Feature, HaluaLogger } from "./types"

type PingApi = { ping: () => string }

function pingFeature(): Feature<PingApi> {
    return {
        apply() {
            return { ping: () => "pong" }
        },
    }
}

describe("createHalua", () => {
    test("build() with no dispatchers is a silent logger", () => {
        let logger = createHalua().build()
        logger.info("no-op")
    })

    test("dispatchers + level + withArgs apply", () => {
        let lines: string[] = []
        let logger = createHalua()
            .dispatchers(NewTextDispatcher((line) => lines.push(line)))
            .level(Level.Warn)
            .withArgs(["app", "api"])
            .build()
        logger.info("hidden")
        logger.warn("visible")
        expect(lines.length).toBe(1)
        expect(lines[0]).toMatch(/WARN visible/)
        expect(lines[0]).toContain("app api")
    })

    test("use() methods exist after build and survive child", () => {
        let logger = createHalua()
            .dispatchers(NewTextDispatcher(() => {}))
            .use(pingFeature())
            .build() as HaluaLogger & PingApi
        expect(logger.ping()).toBe("pong")
        expect(logger.child("a", 1).ping()).toBe("pong")
    })

    test("ErrorMeta generic is preserved", () => {
        type Meta = { issueKey: string }
        let metas: any[] = []
        let logger = createHalua<Meta>()
            .dispatchers(
                NewTextDispatcher((_line, errorMeta) => {
                    if (errorMeta) metas.push(errorMeta)
                }),
            )
            .build()
        logger.error(new Error("x"), { issueKey: "A-1" })
        expect(metas[0]).toMatchObject({ issueKey: "A-1" })
        // @ts-expect-error
        logger.error(new Error("y"), { nope: 1 })
    })
})
