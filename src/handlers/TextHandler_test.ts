import { afterEach, describe, expect, test, vi } from "vitest"
import { NewTextHandler } from "./TextHandler"
import { log, logWithArgs, logWithVars } from "../mocks/logs"
import { toLevel } from "../util/level"

describe("TextHandler", () => {
    let receiver = vi.fn()
    let handler = NewTextHandler(receiver)

    afterEach(vi.clearAllMocks)

    test.each([
        ["debug", "6/30/2025 10:54:49 PM DEBUG log message"],
        ["info", "6/30/2025 10:54:49 PM INFO log message"],
        ["warn", "6/30/2025 10:54:49 PM WARN log message"],
        ["error", "6/30/2025 10:54:49 PM ERR log message"],
    ])("outputs single message with %s", (field, expected) => {
        handler.log({
            ...log,
            level: toLevel(field as "debug" | "info" | "warn" | "error"),
        })
        expect(receiver).toHaveBeenCalledWith(expected)
    })

    test("outputs message with variables", () => {
        handler.log({ ...logWithVars })
        expect(receiver).toHaveBeenCalledWith(
            `6/30/2025 10:54:49 PM DEBUG log message count=1 arr=[1,2,3] obj={"prop":"value","nested":{"prop":"value"}} mySet=Set[1,2,3,4,5] myMap={"key":"value"} [1,2,3] [5,6,7]`,
        )
    })

    test("correctly sets linked arguments in output", () => {
        handler.log(logWithArgs)
        expect(receiver).toHaveBeenCalledWith(
            `6/30/2025 10:54:49 PM DEBUG log message count=2 [1,2,3] arr anotherCount=5`,
        )
    })

    test("link arguments can be turned off", () => {
        let h = NewTextHandler(receiver, { linkArguments: false })
        h.log(logWithArgs)
        expect(receiver).toHaveBeenCalledWith(
            `6/30/2025 10:54:49 PM DEBUG log message count 2 [1,2,3] arr anotherCount 5`,
        )
    })
})
