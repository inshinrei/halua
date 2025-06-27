import { describe, expect, test, vi } from "vitest"
import { JSONHandler } from "./JSONHandler"
import { log, logWithVars } from "../mocks/logs"

describe("JSONHandler", () => {
  let receiver = vi.fn()
  let handler = JSONHandler(receiver)

  test.each([
    ["debug", `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"DEBUG"}`],
    ["info", `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"INFO"}`],
    ["warn", `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"WARN"}`],
    ["error", `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"ERR"}`],
    ["assert", `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"ERR"}`],
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
      `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{"count":1,"attr":"attribute","arr":[1,2,3],"symb":"Symbol(symb)","obj":{"prop":"value","nested":{"prop":"value"}},"mySet":[1,2,3,4,5],"myMap":{"key":"value"}},"level":"DEBUG"}`,
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver).not.toHaveBeenCalled()
  })
})
