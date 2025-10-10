import { afterEach, describe, expect, test, vi } from "vitest"
import { NewWebConsoleHandler } from "./WebConsoleHandler/WebConsoleHandler"
import { log, logWithArgs } from "../mocks/logs"

describe("WebConsoleHandler", () => {
    function setupHandler(receiver: any, options = {}) {
        return NewWebConsoleHandler(receiver, options)()
    }

    let receiver = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }
    let handler = setupHandler(receiver, {
        fetchBrowserThemeOnInstanceCreation: false,
        useError: true,
        useWarn: true,
    })

    afterEach(() => {
        vi.clearAllMocks()
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
        let h = setupHandler(receiver, { linkArguments: false })
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
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
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
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...["%s %s %s %d %o %s %s %d", "log message", ">", "count =", 2, [1, 2, 3], "arr", "anotherCount =", 5],
            )
        })

        test("absent withArgs does remove separator", () => {
            let format = "%t %l %a >> %w"
            setupHandler(receiver, { messageFormat: format }).log(log)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...["%s %s %s", "6/30/2025 10:54:49 PM", "DEBUG", "log message"],
            )
        })

        test("prefixed", () => {
            let format = "[prefixed] %t %l %a > %w"
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
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
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %d %o %s %s %d",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                    "log message",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })

        test("args first", () => {
            let format = "%a %w > %t %l"
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %d %o %s %s %d %s %s %s",
                    "log message",
                    "count",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                    ">",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                ],
            )
        })

        test("separator change", () => {
            let format = "%t %l %a ::: %w"
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %s %d %o %s %s %d",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                    "log message",
                    ":::",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })

        test("adding staff", () => {
            let format = "[time] %t on level %l with args %a and with %w"
            setupHandler(receiver, { messageFormat: format }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %s %s %s %s %s %s %s %d %o %s %s %d",
                    "[time]",
                    "6/30/2025 10:54:49 PM",
                    "on",
                    "level",
                    "DEBUG",
                    "with",
                    "args",
                    "log message",
                    "and",
                    "with",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })
    })

    describe("messageFormatPretty", () => {
        test("standard", () => {
            let format = "%t %l %a > %w"
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %d %o %s %s %d",
                    "%c6/30/2025 10:54:49 PM %cDEBUG%c",
                    "color:#565656",
                    "color:#8A228A",
                    "color:#224912",
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
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %d %o %s %s %d",
                    "%c",
                    "color:#224912",
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

        test("absent withArgs does remove separator", () => {
            let format = "%t %l %a >> %w"
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(log)
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

        test.todo("prefixed", () => {
            let format = "[prefixed] %t %l %a > %w"
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %s %d %o %s %s %d",
                    "%c6/30/2025 10:54:49 PM %cDEBUG%c",
                    "color:#565656",
                    "color:#8A228A",
                    "color:#224912",
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
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %d %o %s %s %d",
                    "%c6/30/2025 10:54:49 PM %cDEBUG%c",
                    "color:#565656",
                    "color:#8A228A",
                    "color:#224912",
                    "log message",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })

        test.todo("args first", () => {
            let format = "%a %w > %t %l"
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %d %o %s %s %d %s",
                    "%c%c6/30/2025 10:54:49 PM %cDEBUG",
                    "color:#224912",
                    "color:#565656",
                    "color:#8A228A",

                    "log message",
                    "count",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                    ">",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                ],
            )
        })

        test("separator change", () => {
            let format = "%t %l %a ::: %w"
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %d %o %s %s %d",
                    "%c6/30/2025 10:54:49 PM %cDEBUG%c",
                    "color:#565656",
                    "color:#8A228A",
                    "color:#224912",
                    "log message",
                    ":::",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })

        test.todo("adding staff", () => {
            let format = "[time] %t on level %l with args %a and with %w"
            setupHandler(receiver, {
                messageFormat: format,
                pretty: true,
                fetchBrowserThemeOnInstanceCreation: false,
            }).log(logWithArgs)
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %s %s %s %s %s %s %s %s %d %o %s %s %d",
                    "%c6/30/2025 10:54:49 PM %cDEBUG%c",
                    "color:#565656",
                    "color:#8A228A",
                    "color:#224912",
                    "[time]",
                    "6/30/2025 10:54:49 PM",
                    "on",
                    "level",
                    "DEBUG",
                    "with",
                    "args",
                    "log message",
                    "and",
                    "with",
                    "count =",
                    2,
                    [1, 2, 3],
                    "arr",
                    "anotherCount =",
                    5,
                ],
            )
        })
    })
})
