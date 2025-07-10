import { describe, expect, test, vi } from "vitest"
import { NewTextHandler } from "./NewTextHandler"
import { log, logWithVars } from "../mocks/logs"

describe("TextHandler", () => {
  let receiver = vi.fn()
  let handler = NewTextHandler(receiver)

  test.each([
    ["debug", "6/30/2025 10:54:49 PM DEBUG log message"],
    ["info", "6/30/2025 10:54:49 PM INFO log message"],
    ["warn", "6/30/2025 10:54:49 PM WARN log message"],
    ["error", "6/30/2025 10:54:49 PM ERR log message"],
    ["assert", "6/30/2025 10:54:49 PM ERR log message"],
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
      `6/30/2025 10:54:49 PM DEBUG log message count=1 arr=[1,2,3] symb=Symbol(symb) obj={"prop":"value","nested":{"prop":"value"}} mySet=Set[1,2,3,4,5] myMap={"key":"value"} [1,2,3] [5,6,7]`,
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver).not.toHaveBeenCalled()
  })
})
