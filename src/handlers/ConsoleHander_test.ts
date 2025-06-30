import { describe, expect, test, vi } from "vitest"
import { ConsoleHandler } from "./ConsoleHandler"
import { log, logWithVars } from "../mocks/logs"

describe("ConsoleHandler", () => {
  let receiver = {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    assert: vi.fn(),
  }
  let handler = ConsoleHandler(receiver)

  test.each([
    ["debug", ["00/00/00 00:00:00", " DEBUG", " log message"]],
    ["info", ["00/00/00 00:00:00", " INFO", " log message"]],
    ["warn", ["00/00/00 00:00:00", " WARN", " log message"]],
    ["error", ["00/00/00 00:00:00", " ERR", " log message"]],
    ["assert", [false, "00/00/00 00:00:00", " ERR", " log message"]],
  ])("outputs single messsage with %s", (field, expected) => {
    vi.clearAllMocks()
    if (field === "assert") {
      handler[field](false, log)
    } else {
      handler[field as "debug" | "info" | "warn" | "error"](log)
    }
    if (field === "info") {
      field = "log"
    }
    expect(receiver[field as "assert" | "debug" | "log" | "warn" | "error"]).toHaveBeenCalledWith(...expected)
  })

  test("outputs message with variables", () => {
    vi.clearAllMocks()
    handler.debug(logWithVars)
    expect(receiver.debug).toHaveBeenCalledWith(
      ...[
        "00/00/00 00:00:00",
        " DEBUG",
        " log message",
        " count=",
        1,
        " attr=",
        "attribute",
        " arr=",
        logWithVars.variables.arr,
        " symb=",
        logWithVars.variables.symb,
        " obj=",
        logWithVars.variables.obj,
        " mySet=",
        logWithVars.variables.mySet,
        " myMap=",
        logWithVars.variables.myMap,
      ],
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver.assert).toHaveBeenCalledWith(...[true, "00/00/00 00:00:00", " ERR", " log message"])
  })
})
