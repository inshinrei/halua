import { describe, expect, test, vi } from "vitest"
import { WebBrowserConsoleHandler } from "./WebBrowserConsoleHandler"
import { log, logWithArgs, logWithVars } from "../mocks/logs"

describe("ConsoleHandler", () => {
  let receiver = {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    assert: vi.fn(),
  }
  let handler = WebBrowserConsoleHandler(receiver)

  test.each([
    ["debug", ["6/30/2025 10:54:49 PM", "DEBUG", "log message"]],
    ["info", ["6/30/2025 10:54:49 PM", "INFO", "log message"]],
    ["warn", ["6/30/2025 10:54:49 PM", "WARN", "log message"]],
    ["error", ["6/30/2025 10:54:49 PM", "ERR", "log message"]],
    ["assert", [false, "6/30/2025 10:54:49 PM", "ERR", "log message"]],
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
        "6/30/2025 10:54:49 PM",
        "DEBUG",
        "log message",
        "count=",
        1,
        "attr=",
        "attribute",
        "arr=",
        logWithVars.variables.arr,
        "symb=",
        logWithVars.variables.symb,
        "obj=",
        logWithVars.variables.obj,
        "mySet=",
        logWithVars.variables.mySet,
        "myMap=",
        logWithVars.variables.myMap,
      ],
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver.assert).toHaveBeenCalledWith(...[true, "6/30/2025 10:54:49 PM", "ERR", "log message"])
  })

  test("outputs message with spare arguments", () => {
    vi.clearAllMocks()
    handler.debug(logWithArgs)
    expect(receiver.debug).toHaveBeenCalledWith(
      ...["6/30/2025 10:54:49 PM", "DEBUG", "log message", 1, "stringus", [1, 2, 3]],
    )
  })

  test("supports date getter passing", () => {
    vi.clearAllMocks()
    handler.setDateGetter((_) => `abobus`)
    handler.debug(log)
    expect(receiver.debug).toHaveBeenCalledWith(...["abobus", "DEBUG", "log message"])
  })
})
