import { afterEach, describe, expect, test, vi } from "vitest"
import { NewJSONHandler } from "./JSONHandler"
import { log, logWithArgs, logWithVars } from "../mocks/logs"
import { Level } from "./types"

describe("JSONHandler", () => {
    let receiver = vi.fn()
    let handler = NewJSONHandler(receiver)

    afterEach(() => {
        vi.clearAllMocks()
    })

    test.each([
        [Level.Debug, `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"DEBUG"}`],
        [Level.Info, `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"INFO"}`],
        [Level.Warn, `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"WARN"}`],
        [Level.Error, `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"ERR"}`],
        ["assert", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"ERR"}`],
    ])("outputs single message with %s", (field: string, expected) => {
        if (field === "assert") {
            handler.log(
                structuredClone({
                    ...log,
                    assertion: false,
                    level: "ERR" as Level,
                }),
            )
        } else {
            handler.log(
                structuredClone({
                    ...log,
                    level: field as Level,
                }),
            )
        }
        expect(receiver).toHaveBeenCalledWith(expected)
    })

    test("outputs message with variables", () => {
        handler.log(structuredClone(logWithVars))
        expect(receiver).toHaveBeenCalledWith(
            `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message","count",1,"arr",[1,2,3],"obj",{"prop":"value","nested":{"prop":"value"}},"mySet",[1,2,3,4,5],"myMap",{"key":"value"},[1,2,3],[5,6,7]],"level":"DEBUG"}`,
        )
    })

    test("outputs message with arguments", () => {
        handler.log(structuredClone(logWithArgs))
        expect(receiver).toHaveBeenCalledWith(
            `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message",[1,2,3]],"level":"DEBUG","count":2,"anotherCount":5}`,
        )
    })

    test("date getter can be changed", () => {
        NewJSONHandler(receiver, {
            dateGetter: () => "2025",
        }).log(structuredClone(log))
        expect(receiver).toHaveBeenCalledWith(`{"timestamp":"2025","args":["log message"],"level":"DEBUG"}`)
    })

    test("json stringify replacer can be passed", () => {
        NewJSONHandler(receiver, {
            replaceBeforeStringify: (data: any) => {
                if (typeof data === "string" && data === "log message") {
                    return "replaced"
                }
                return null
            },
        }).log(structuredClone(log))
        expect(receiver).toHaveBeenCalledWith(
            `{"timestamp":"2025-06-30T19:54:49.663Z","args":["replaced"],"level":"DEBUG"}`,
        )
    })

    test("link arguments could be turned off", () => {
        let handlerWithNoFlattening = NewJSONHandler(receiver, { linkArguments: false })
        handlerWithNoFlattening.log(structuredClone(logWithArgs))
        expect(receiver).toHaveBeenCalledWith(
            `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"DEBUG","withArgs":["count",2,[1,2,3],"arr","anotherCount",5]}`,
        )
    })
})
