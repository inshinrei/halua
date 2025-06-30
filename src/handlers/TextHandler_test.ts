import { describe, expect, test, vi } from "vitest"
import { TextHandler } from "./TextHandler"
import { log, logWithVars } from "../mocks/logs"

describe("TextHandler", () => {
  let receiver = vi.fn()
  let handler = TextHandler(receiver)

  test.each([
    ["debug", "1751313289663 DEBUG log message"],
    ["info", "1751313289663 INFO log message"],
    ["warn", "1751313289663 WARN log message"],
    ["error", "1751313289663 ERR log message"],
    ["assert", "1751313289663 ERR log message"],
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
      `1751313289663 DEBUG log message count="1" attr="attribute" arr="[1,2,3]" symb="Symbol(symb)" obj="{ prop="value" nested={ prop="value" } }" mySet="Set[1,2,3,4,5]" myMap="{ key="value" }"`,
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver).not.toHaveBeenCalled()
  })
})
