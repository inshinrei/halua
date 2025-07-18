import { describe, expect, test, vi } from "vitest"
import { NewJSONHandler } from "./JSONHandler"
import { log, logWithArgs, logWithVars } from "../mocks/logs"

describe("JSONHandler", () => {
  let receiver = vi.fn()
  let handler = NewJSONHandler(receiver)

  test.each([
    ["debug", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"DEBUG"}`],
    ["info", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"INFO"}`],
    ["warn", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"WARN"}`],
    ["error", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"ERR"}`],
    ["assert", `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"level":"ERR"}`],
  ])("outputs single message with %s", (field, expected) => {
    vi.clearAllMocks()
    if (field === "assert") {
      handler[field](false, structuredClone(log))
    } else {
      handler[field as "debug" | "info" | "warn" | "error"](structuredClone(log))
    }
    expect(receiver).toHaveBeenCalledWith(expected)
  })

  test("outputs message with variables", () => {
    vi.clearAllMocks()
    handler.debug(structuredClone(logWithVars))
    expect(receiver).toHaveBeenCalledWith(
      `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message","count",1,"arr",[1,2,3],"obj",{"prop":"value","nested":{"prop":"value"}},"mySet",[1,2,3,4,5],"myMap",{"key":"value"},[1,2,3],[5,6,7]],"level":"DEBUG"}`,
    )
  })

  test("outputs message with arguments", () => {
    vi.clearAllMocks()
    handler.debug(structuredClone(logWithArgs))
    expect(receiver).toHaveBeenCalledWith(
      `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message",[1,2,3]],"level":"DEBUG","count":2,"anotherCount":5}`,
    )
  })

  test.todo("correctly outputs linked arguments")

  test.todo("date getter can be changed")

  test.todo("json stringify replacer can be passed")

  test("linked arguments could be turned off", () => {
    vi.clearAllMocks()
    let handlerWithNoFlattening = NewJSONHandler(receiver, { linkedArgumentsFlatten: false })
    handlerWithNoFlattening.debug(structuredClone(logWithArgs))
    expect(receiver).toHaveBeenCalledWith(
      `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message"],"withArgs":["count",2,[1,2,3],"arr","anotherCount",5],"level":"DEBUG"}`,
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, structuredClone(log))
    expect(receiver).not.toHaveBeenCalled()
  })
})
