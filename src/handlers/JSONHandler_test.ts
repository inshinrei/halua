import { describe, expect, test, vi } from "vitest"
import { NewJSONHandler } from "./NewJSONHandler"
import { log, logWithVars } from "../mocks/logs"

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
      handler[field](false, log)
    } else {
      handler[field as "debug" | "info" | "warn" | "error"](log)
    }
    expect(receiver).toHaveBeenCalledWith(expected)
  })

  test("outputs message with variables", () => {
    vi.clearAllMocks()
    handler.debug(logWithVars)
    expect(receiver).toHaveBeenCalledWith(
      `{"timestamp":"2025-06-30T19:54:49.663Z","args":["log message","count",1,"arr",[1,2,3],"symb","Symbol(symb)","obj",{"prop":"value","nested":{"prop":"value"}},"mySet",[1,2,3,4,5],"myMap",{"key":"value"},[1,2,3],[5,6,7]],"level":"DEBUG"}`,
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver).not.toHaveBeenCalled()
  })
})
