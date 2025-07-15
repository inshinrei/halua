import { describe, expect, test, vi } from "vitest"
import { NewWebBrowserConsoleHandler } from "./NewWebBrowserConsoleHandler"
import { log, logWithVars } from "../mocks/logs"

describe("ConsoleHandler", () => {
  let receiver = {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    assert: vi.fn(),
  }
  let handler = NewWebBrowserConsoleHandler(receiver, {
    fetchBrowserThemeOnInstanceCreation: false,
  })

  test.each([
    ["debug", ["%s %s %s", "6/30/2025 10:54:49 PM", " DEBUG", "log message"]],
    ["info", ["%s %s %s", "6/30/2025 10:54:49 PM", " INFO", "log message"]],
    ["warn", ["%s %s %s", "6/30/2025 10:54:49 PM", " WARN", "log message"]],
    ["error", ["%s %s %s", "6/30/2025 10:54:49 PM", " ERR", "log message"]],
    ["assert", [false, "%s %s %s", "6/30/2025 10:54:49 PM", " ERR", "log message"]],
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
        "%s %s %s %s %d %s %o %s %o %s %o %s %o %s %o %o %o",
        "6/30/2025 10:54:49 PM",
        " DEBUG",
        "log message",
        "count=",
        1,
        "arr=",
        [1, 2, 3],
        "symb=",
        logWithVars.args[6],
        "obj=",
        logWithVars.args[8],
        "mySet=",
        logWithVars.args[10],
        "myMap=",
        logWithVars.args[12],
        [1, 2, 3],
        [5, 6, 7],
      ],
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, log)
    expect(receiver.assert).toHaveBeenCalledWith(...[true, "%s %s %s", "6/30/2025 10:54:49 PM", " ERR", "log message"])
  })

  test("supports date getter passing", () => {
    vi.clearAllMocks()
    handler.setDateGetter((_) => `abobus`)
    handler.debug(log)
    expect(receiver.debug).toHaveBeenCalledWith(...["%s %s %s", "abobus", " DEBUG", "log message"])
  })
})
