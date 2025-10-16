import { afterEach, describe, expect, test, vi } from "vitest"
import { NewJSONHandler } from "./JSONHandler"
import { mockLogSimple, mockLogWithArgs, mockLogWithComplexStructs } from "../../mocks/logs"

describe("JSONHandler", () => {
    function setupHandler(receiver: any, options = {}) {
        return NewJSONHandler(receiver, options)()
    }

    let receiver = vi.fn()
    let handler = setupHandler(receiver)

    afterEach(vi.clearAllMocks)

    describe("output and formatting", () => {
        test.each([
            ["DEBUG", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"DEBUG"}`],
            ["INFO", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"INFO"}`],
            ["WARN", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"WARN"}`],
            ["ERROR", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"ERROR"}`],
        ])("single message with %s", (field, expected) => {
            handler.log(structuredClone({ ...mockLogSimple, level: field }))
            expect(receiver).toHaveBeenCalledWith(expected)
        })

        test("with args", () => {
            handler.log(structuredClone(mockLogWithArgs))
            expect(receiver).toHaveBeenCalledWith(
                `{"timestamp":"2025-06-30T19:54:49.663Z","args":[{"field":"of value"},[1,2,3,4,5],["array of","not strings",3,4]],"level":"DEBUG","count":22}`,
            )
        })

        test("with complex structs", () => {
            handler.log(structuredClone(mockLogWithComplexStructs))
            expect(receiver).toHaveBeenCalledWith(
                `{"timestamp":"2025-06-30T19:54:49.663Z","args":[{"field":"value","nesting":{"prop":{"nestedProp":"value2"}}},[{"prop":"value"},{"type":"propped"}],[1,2,[{"prop":1}],[1,2,3,4,5],{"field":"value","map":{"key":"value"},"set":[1,2]}]],"level":"DEBUG"}`,
            )
        })

        test("errors output", () => {
            handler.log({ ...mockLogSimple, args: [new Error("test error")] })
            expect(receiver).toHaveBeenCalledWith(
                `{"timestamp":"2025-06-30T19:54:49.663Z","args":["Error: test error"],"level":"DEBUG"}`,
            )
        })
    })

    describe("options", () => {
        describe("linked arguments", () => {
            test.todo("correctly sets them", () => {})

            test("could be turned off", () => {
                setupHandler(receiver, { linkArguments: false }).log(structuredClone(mockLogWithArgs))
                expect(receiver).toHaveBeenCalledWith(
                    `{"timestamp":"2025-06-30T19:54:49.663Z","args":[{"field":"of value"},[1,2,3,4,5]],"level":"DEBUG","withArgs":["count",2,["array of","not strings",3,4],"count",22]}`,
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

                setupHandler(receiver, { replaceBeforeStringify }).log(structuredClone(mockLogSimple))
                expect(receiver).toHaveBeenCalledWith(
                    `{"timestamp":"2025-06-30T19:54:49.663Z","args":["replaced"],"level":"DEBUG"}`,
                )
            })

            test.todo("called n of values times")
        })

        // date getter

        describe("stringifier", () => {
            test.todo("called to stringify a value", () => {})
        })
    })
})
