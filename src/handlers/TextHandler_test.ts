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
            `6/30/2025 10:54:49 PM DEBUG log message | count=2 [1,2,3] arr anotherCount=5`,
        )
    })

    test("link arguments can be turned off", () => {
        let h = NewTextHandler(receiver, { linkArguments: false })
        h.log(logWithArgs)
        expect(receiver).toHaveBeenCalledWith(
            `6/30/2025 10:54:49 PM DEBUG log message | count 2 [1,2,3] arr anotherCount 5`,
        )
    })

    test("replaceBeforeStringify option could be passed", () => {
        let h = NewTextHandler(receiver, {
            replaceBeforeStringify: (data: any) => {
                if (typeof data === "string" && data === "log message") {
                    return "replaced"
                }
                return null
            },
        })
        h.log(log)
        expect(receiver).toHaveBeenCalledWith(`6/30/2025 10:54:49 PM DEBUG replaced`)
    })

    describe("messageFormat", () => {
        test("standard", () => {
            let format = "%t %l %a > %w"
            NewTextHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver).toHaveBeenCalledWith(
                `6/30/2025 10:54:49 PM DEBUG log message > count=2 [1,2,3] arr anotherCount=5`,
            )
        })

        test("remove time and level", () => {
            let format = "%a > %w"
            NewTextHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver).toHaveBeenCalledWith(`log message > count=2 [1,2,3] arr anotherCount=5`)
        })

        test("absent withArgs does remove separator", () => {
            let format = "%t %l %a >> %w"
            NewTextHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver).toHaveBeenCalledWith(`6/30/2025 10:54:49 PM DEBUG log message`)
        })

        test("prefixed", () => {
            let format = "[prefixed] %t %l %a > %w"
            NewTextHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver).toHaveBeenCalledWith(`[prefixed] 6/30/2025 10:54:49 PM DEBUG log message`)
        })

        test("no spaces", () => {
            let format = "%t%l%a%w"
            NewTextHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver).toHaveBeenCalledWith(
                `6/30/2025 10:54:49 PMDEBUGlog messagecount=2 [1,2,3] arr anotherCount=5`,
            )
        })

        test("args first", () => {
            let format = "%a %w > %t %l"
            NewTextHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver).toHaveBeenCalledWith(
                `log message count=2 [1,2,3] arr anotherCount=5 > 6/30/2025 10:54:49 PM DEBUG`,
            )
        })

        test("separator change", () => {
            let format = "%t %l %a ::: %w"
            NewTextHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver).toHaveBeenCalledWith(
                `6/30/2025 10:54:49 PM DEBUG log message ::: count=2 [1,2,3] arr anotherCount=5`,
            )
        })

        test("adding staff", () => {
            let format = "[time] %t on level %l with args %a and with %w"
            NewTextHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver).toHaveBeenCalledWith(
                `[time] 6/30/2025 10:54:49 PM on level DEBUG with args log message and with count=2 [1,2,3] arr anotherCount=5`,
            )
        })
    })
})
