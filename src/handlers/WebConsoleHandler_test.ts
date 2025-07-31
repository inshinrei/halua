import { afterEach, describe, expect, test, vi } from "vitest"
import { NewWebConsoleHandler } from "./WebConsoleHandler"
import { log, logWithArgs, logWithVars } from "../mocks/logs"
import { Level } from "./types"
import { toLevel } from "../util/level"

describe("WebConsoleHandler", () => {
    let receiver = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }
    let handler = NewWebConsoleHandler(receiver, {
        fetchBrowserThemeOnInstanceCreation: false,
        useError: true,
        useWarn: true,
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    test.each([
        ["debug", ["%s %s %s", "6/30/2025 10:54:49 PM", "DEBUG", "log message"]],
        ["info", ["%s %s %s", "6/30/2025 10:54:49 PM", "INFO", "log message"]],
        ["warn", ["%s %s %s", "6/30/2025 10:54:49 PM", "WARN", "log message"]],
        ["error", ["%s %s %s", "6/30/2025 10:54:49 PM", "ERR", "log message"]],
    ])("outputs single messsage with %s", (field, expected) => {
        handler.log(structuredClone({ ...log, level: toLevel(field as "debug" | "info" | "warn" | "error") }))
        expect(receiver[field as "debug" | "info" | "warn" | "error"]).toHaveBeenCalledWith(...expected)
    })

    test("outputs message with variables", () => {
        handler.log(structuredClone(logWithVars))
        expect(receiver.debug).toHaveBeenCalledWith(
            ...[
                "%s %s %s %s %d %s %o %s %o %s %o %s %o %o %o",
                "6/30/2025 10:54:49 PM",
                "DEBUG",
                "log message",
                "count =",
                1,
                "arr =",
                [1, 2, 3],
                "obj =",
                logWithVars.args[6],
                "mySet =",
                logWithVars.args[8],
                "myMap =",
                logWithVars.args[10],
                [1, 2, 3],
                [5, 6, 7],
            ],
        )
    })

    test("separates withArgs from args", () => {
        handler.log(structuredClone(logWithArgs))
        expect(receiver.debug).toHaveBeenCalledWith(
            ...[
                "%s %s %s %s %s %d %o %s %s %d",
                "6/30/2025 10:54:49 PM",
                "DEBUG",
                "log message",
                "|",
                "count =",
                2,
                [1, 2, 3],
                "arr",
                "anotherCount =",
                5,
            ],
        )
    })

    test("supports pretty option with browser theme turned off", () => {
        let prettyHandler = NewWebConsoleHandler(receiver, {
            pretty: true,
            fetchBrowserThemeOnInstanceCreation: false,
        })
        prettyHandler.log(log)
        expect(receiver.debug).toHaveBeenCalledWith(
            ...[
                "%s %s",
                "%c6/30/2025 10:54:49 PM %cDEBUG%c",
                "color:#565656",
                "color:#8A228A",
                "color:#224912",
                "log message",
            ],
        )
    })

    test("useWarn and useError can be turned on", () => {
        let h = NewWebConsoleHandler(receiver, { useWarn: true, useError: true })
        h.log({ ...log, level: Level.Warn })
        h.log({ ...log, level: Level.Error })
        expect(receiver.warn).toHaveBeenCalledTimes(1)
        expect(receiver.error).toHaveBeenCalledTimes(1)
    })

    test("correctly implies linked arguments", () => {
        handler.log(
            structuredClone({
                ...log,
                args: ["count", "count2", "count3", 5],
            }),
        )
        expect(receiver.debug).toHaveBeenCalledWith(
            ...["%s %s %s %s %s %d", "6/30/2025 10:54:49 PM", "DEBUG", "count", "count2", "count3 =", 5],
        )
    })

    test("link arguments can be turned off", () => {
        let h = NewWebConsoleHandler(receiver, { linkArguments: false })
        h.log(
            structuredClone({
                ...log,
                args: ["count", "count2", "count3", 5],
            }),
        )
        expect(receiver.debug).toHaveBeenCalledWith(
            ...["%s %s %s %s %s %d", "6/30/2025 10:54:49 PM", "DEBUG", "count", "count2", "count3", 5],
        )
    })

    test("supports date getter passing", () => {
        handler.setDateGetter((_) => `abobus`)
        handler.log(structuredClone(log))
        expect(receiver.debug).toHaveBeenCalledWith(...["%s %s %s", "abobus", "DEBUG", "log message"])
    })

    describe("messageFormat", () => {
        test("standard", () => {
            let format = "%t %l %a > %w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %s %d %o %s %s %d",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                    "log message",
                    ">",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })

        test("remove time and level", () => {
            let format = "%a > %w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...["%s %s %s %d %o %s %s %d", "log message", ">", "count", 2, [1, 2, 3], "arr", "anotherCount =", 5],
            )
        })

        test("absent withArgs does remove separator", () => {
            let format = "%t %l %a >> %w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...["%s %s %s", "6/30/2025 10:54:49 PM", "DEBUG", "log message"],
            )
        })

        test("prefixed", () => {
            let format = "[prefixed] %t %l %a > %w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %s %s %d %o %s %s %d",
                    "[prefixed]",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                    "log message",
                    ">",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })

        test("no spaces", () => {
            let format = "%t%l%a%w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver.debug).toHaveBeenCalledWith()
        })

        test("args first", () => {
            let format = "%a %w > %t %l"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver.debug).toHaveBeenCalledWith()
        })

        test("separator change", () => {
            let format = "%t %l %a ::: %w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver.debug).toHaveBeenCalledWith()
        })

        test("adding staff", () => {
            let format = "[time] %t on level %l with args %a and with %w"
            NewWebConsoleHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver.debug).toHaveBeenCalledWith()
        })
    })

    describe("messageFormatPretty", () => {})
})
