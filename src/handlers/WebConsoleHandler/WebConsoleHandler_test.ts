import { afterEach, describe, expect, test, vi } from "vitest"
import { NewWebConsoleHandler } from "./WebConsoleHandler"
import { mockLogSimple, mockLogWithArgs } from "../../mocks/logs"
import { toLevel } from "../../util/level"
import { Level } from "../types"

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

    afterEach(vi.clearAllMocks)

    describe("output and formatting", () => {
        test.each([
            ["debug", ["%s %s %s", "6/30/2025 10:54:49 PM", "DEBUG", "log message"]],
            ["info", ["%s %s %s", "6/30/2025 10:54:49 PM", "INFO", "log message"]],
            ["warn", ["%s %s %s", "6/30/2025 10:54:49 PM", "WARN", "log message"]],
            ["error", ["%s %s %s", "6/30/2025 10:54:49 PM", "ERROR", "log message"]],
        ])("outputs single message with %s", (field, expected) => {
            handler.log(
                structuredClone({
                    ...mockLogSimple,
                    level: toLevel(field as "debug" | "info" | "warn" | "error"),
                }),
            )
            expect(receiver[field as "debug" | "info" | "warn" | "error"]).toHaveBeenCalledWith(...expected)
        })

        test("with args", () => {
            handler.log(structuredClone(mockLogWithArgs))
            expect(receiver.debug).toHaveBeenCalledWith(
                ...[
                    "%s %s %o %o %s %s %d %o %s %d",
                    "6/30/2025 10:54:49 PM",
                    "DEBUG",
                    { field: "of value" },
                    [1, 2, 3, 4, 5],
                    "|",
                    "count =",
                    2,
                    ["array of", "not strings", 3, 4],
                    "count =",
                    22,
                ],
            )
        })

        test.todo("with complex structs", () => {})

        test("errors output", () => {
            let e = new Error("test error")
            handler.log({ ...mockLogSimple, args: [e] })
            expect(receiver.debug).toHaveBeenCalledWith(...["%s %s %o", "6/30/2025 10:54:49 PM", "DEBUG", e])
        })
    })

    describe.todo("options", () => {
        describe("useWarn, useError", () => {
            let h = setupHandler(receiver, { useWarn: true, useError: true })
            h.log({ ...mockLogSimple, level: Level.Warn })
            h.log({ ...mockLogSimple, level: Level.Error })
            expect(receiver.warn).toHaveBeenCalledTimes(1)
            expect(receiver.error).toHaveBeenCalledTimes(1)
        })

        describe.todo("linked arguments", () => {
            test("correctly sets them", () => {})

            test("could be turned off", () => {})
        })

        describe.todo("deprecated message format")
    })
})
