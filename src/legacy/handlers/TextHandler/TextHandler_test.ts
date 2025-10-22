import { afterEach, describe, expect, test, vi } from "vitest"
import { NewTextHandler } from "./TextHandler"
import { mockLogSimple, mockLogWithArgs, mockLogWithComplexStructs } from "../../mocks/logs"
import { toLevel } from "../../util/level"

describe("TextHandler", () => {
    function setupHandler(receiver: (data: string) => void, options = {}) {
        return NewTextHandler(receiver, options)()
    }

    let receiver = vi.fn()
    let handler = setupHandler(receiver)

    afterEach(vi.clearAllMocks)

    describe("output and formatting", () => {
        test.each([
            ["debug", "6/30/2025 7:54:49 PM DEBUG log message"],
            ["info", "6/30/2025 7:54:49 PM INFO log message"],
            ["warn", "6/30/2025 7:54:49 PM WARN log message"],
            ["error", "6/30/2025 7:54:49 PM ERROR log message"],
        ])("single message with %s", (field, expected) => {
            handler.log({
                ...mockLogSimple,
                level: toLevel(field as "debug" | "info" | "warn" | "error"),
            })
            expect(receiver).toHaveBeenCalledWith(expected)
        })

        test("with args", () => {
            handler.log({ ...mockLogWithArgs })
            expect(receiver).toHaveBeenCalledWith(
                `6/30/2025 7:54:49 PM DEBUG {"field":"of value"} [1,2,3,4,5] | count=2 [array of,not strings,3,4] count=22`,
            )
        })

        test.todo("with complex structs", () => {
            handler.log(structuredClone(mockLogWithComplexStructs))
            expect(receiver).toHaveBeenCalledWith(``)
        })
    })

    describe("options", () => {
        describe("linked arguments", () => {
            test("correctly sets them", () => {
                handler.log({ ...mockLogWithArgs })
                expect(receiver).toHaveBeenCalledWith(
                    `6/30/2025 7:54:49 PM DEBUG {"field":"of value"} [1,2,3,4,5] | count=2 [array of,not strings,3,4] count=22`,
                )
            })

            test("could be turned off", () => {
                setupHandler(receiver, { linkArguments: false }).log({ ...mockLogWithArgs })
                expect(receiver).toHaveBeenCalledWith(
                    `6/30/2025 7:54:49 PM DEBUG {"field":"of value"} [1,2,3,4,5] | count 2 [array of,not strings,3,4] count 22`,
                )
            })
        })

        describe("replaceBeforeStringify", () => {
            test("replaces values", () => {
                function replaceBeforeStringify(data: any) {
                    if (typeof data === "string" && data === "log message") {
                        return "replaced"
                    }
                    return null
                }

                setupHandler(receiver, { replaceBeforeStringify }).log(mockLogSimple)
                expect(receiver).toHaveBeenCalledWith(`6/30/2025 7:54:49 PM DEBUG replaced`)
            })

            test.todo("called n of values times")
        })

        describe("stringifier", () => {
            test.todo("called to stringify a value", () => {})
        })

        describe("deprecated message format", () => {
            test("standard", () => {
                let format = "%t %l %a > %w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogWithArgs)
                expect(receiver).toHaveBeenCalledWith(
                    `6/30/2025 7:54:49 PM DEBUG {"field":"of value"} [1,2,3,4,5] > count=2 [array of,not strings,3,4] count=22`,
                )
            })

            test("remove time and level", () => {
                let format = "%a > %w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogWithArgs)
                expect(receiver).toHaveBeenCalledWith(
                    `{"field":"of value"} [1,2,3,4,5] > count=2 [array of,not strings,3,4] count=22`,
                )
            })

            test("absent withArgs does remove separator", () => {
                let format = "%t %l %a >> %w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogSimple)
                expect(receiver).toHaveBeenCalledWith(`6/30/2025 7:54:49 PM DEBUG log message`)
            })

            test("prefixed", () => {
                let format = "[prefixed] %t %l %a > %w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogSimple)
                expect(receiver).toHaveBeenCalledWith(`[prefixed] 6/30/2025 7:54:49 PM DEBUG log message`)
            })

            test("no spaces", () => {
                let format = "%t%l%a%w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogWithArgs)
                expect(receiver).toHaveBeenCalledWith(
                    `6/30/2025 7:54:49 PMDEBUG{"field":"of value"} [1,2,3,4,5]count=2 [array of,not strings,3,4] count=22`,
                )
            })

            test("args first", () => {
                let format = "%a %w > %t %l"
                setupHandler(receiver, { messageFormat: format }).log(mockLogWithArgs)
                expect(receiver).toHaveBeenCalledWith(
                    `{"field":"of value"} [1,2,3,4,5] count=2 [array of,not strings,3,4] count=22 > 6/30/2025 7:54:49 PM DEBUG`,
                )
            })

            test("separator change", () => {
                let format = "%t %l %a ::: %w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogWithArgs)
                expect(receiver).toHaveBeenCalledWith(
                    `6/30/2025 7:54:49 PM DEBUG {"field":"of value"} [1,2,3,4,5] ::: count=2 [array of,not strings,3,4] count=22`,
                )
            })

            test("adding staff", () => {
                let format = "[time] %t on level %l with args %a and with %w"
                setupHandler(receiver, { messageFormat: format }).log(mockLogWithArgs)
                expect(receiver).toHaveBeenCalledWith(
                    `[time] 6/30/2025 7:54:49 PM on level DEBUG with args {"field":"of value"} [1,2,3,4,5] and with count=2 [array of,not strings,3,4] count=22`,
                )
            })
        })
    })
})
