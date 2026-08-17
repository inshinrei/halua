import { describe, expect, test } from "vitest"

import { instantiate } from "./halua"
import { NewTextDispatcher } from "./dispatchers/text-dispatcher"
import type { Feature, HaluaLogger } from "./types"

type PingApi = { ping: () => string }

function pingFeature(): Feature<PingApi> {
    return {
        apply(_host: HaluaLogger<any, any>) {
            return {
                ping: () => "pong",
            }
        },
    }
}

describe("instantiate + feature inheritance", () => {
    test("apply() methods land on the instance", () => {
        let logger = instantiate(
            NewTextDispatcher(() => {}),
            {},
            [pingFeature()],
        ) as HaluaLogger & PingApi
        expect(logger.ping()).toBe("pong")
    })

    test("child() and create() keep the same feature methods", () => {
        let logger = instantiate(
            NewTextDispatcher(() => {}),
            {},
            [pingFeature()],
        ) as HaluaLogger & PingApi
        expect(logger.child("k", "v").ping()).toBe("pong")
        expect(logger.create({}).ping()).toBe("pong")
        expect(logger.create(NewTextDispatcher(() => {})).ping()).toBe("pong")
    })

    test("contributeDispatchers is merged into the live set, not the user blueprint", () => {
        let extraLines: string[] = []
        let userLines: string[] = []
        let extra: Feature<{}> = {
            contributeDispatchers() {
                return [NewTextDispatcher((line) => extraLines.push(line))]
            },
            apply() {
                return {}
            },
        }
        let logger = instantiate(
            NewTextDispatcher((line) => userLines.push(line)),
            {},
            [extra],
        )
        logger.info("hello")
        expect(userLines.some((l) => l.includes("hello"))).toBe(true)
        expect(extraLines.some((l) => l.includes("hello"))).toBe(true)

        // replacing live dispatchers must re-inject feature dispatchers
        let replaced: string[] = []
        logger.setDispatchers(NewTextDispatcher((line) => replaced.push(line)))
        logger.info("after-set")
        expect(replaced.some((l) => l.includes("after-set"))).toBe(true)
        expect(extraLines.some((l) => l.includes("after-set"))).toBe(true)
    })

    test("create(options) still replaces options (does not merge) and still copies features", () => {
        let lines: string[] = []
        let logger = instantiate(
            NewTextDispatcher((line) => lines.push(line)),
            { withArgs: ["flow", "checkout"] },
            [pingFeature()],
        ) as HaluaLogger & PingApi
        logger.info("parent")
        expect(lines[0]).toContain("flow checkout")

        let clean = logger.create({ withArgs: [] }) as HaluaLogger & PingApi
        clean.info("child")
        expect(lines[1]).not.toContain("flow")
        expect(clean.ping()).toBe("pong")
    })
})
