import { describe, expect, test, vi } from "vitest"
import { NewWebBrowserConsoleHandler } from "./WebBrowserConsoleHandler"
import { log, logWithArgs, logWithVars } from "../mocks/logs"

describe("WebBrowserConsoleHandler", () => {
  let receiver = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    assert: vi.fn(),
  }
  let handler = NewWebBrowserConsoleHandler(receiver, {
    fetchBrowserThemeOnInstanceCreation: false,
    useError: true,
    useWarn: true,
  })

  test.each([
    ["debug", ["%s %s %s", "6/30/2025 10:54:49 PM", "DEBUG", "log message"]],
    ["info", ["%s %s %s", "6/30/2025 10:54:49 PM", "INFO", "log message"]],
    ["warn", ["%s %s %s", "6/30/2025 10:54:49 PM", "WARN", "log message"]],
    ["error", ["%s %s %s", "6/30/2025 10:54:49 PM", "ERR", "log message"]],
    ["assert", [false, "%s %s %s", "6/30/2025 10:54:49 PM", "ERR", "log message"]],
  ])("outputs single messsage with %s", (field, expected) => {
    vi.clearAllMocks()
    if (field === "assert") {
      handler[field](false, structuredClone(log))
    } else {
      handler[field as "debug" | "info" | "warn" | "error"](structuredClone(log))
    }
    expect(receiver[field as "assert" | "debug" | "info" | "warn" | "error"]).toHaveBeenCalledWith(...expected)
  })

  test("outputs message with variables", () => {
    vi.clearAllMocks()
    handler.debug(structuredClone(logWithVars))
    expect(receiver.debug).toHaveBeenCalledWith(
      ...[
        "%s %s %s %s %d %s %o %s %o %s %o %s %o %o %o",
        "6/30/2025 10:54:49 PM",
        "DEBUG",
        "log message",
        "count =",
        1,
        "arr =",
        [1, 2, 3],
        "obj =",
        logWithVars.args[6],
        "mySet =",
        logWithVars.args[8],
        "myMap =",
        logWithVars.args[10],
        [1, 2, 3],
        [5, 6, 7],
      ],
    )
  })

  test("separates withArgs from args", () => {
    vi.clearAllMocks()
    handler.debug(structuredClone(logWithArgs))
    expect(receiver.debug).toHaveBeenCalledWith(
      ...[
        "%s %s %s %s %s %d %o %s %s %d",
        "6/30/2025 10:54:49 PM",
        "DEBUG",
        "log message",
        "|",
        "count =",
        2,
        [1, 2, 3],
        "arr",
        "anotherCount =",
        5,
      ],
    )
  })

  test.todo("supports pretty option")

  test.todo("supports custom colors")

  test.todo("useWarn and useError can be turned on")

  test("correctly implies linked arguments", () => {
    vi.clearAllMocks()
    handler.debug(
      structuredClone({
        ...log,
        args: ["count", "count2", "count3", 5],
      }),
    )
    expect(receiver.debug).toHaveBeenCalledWith(
      ...["%s %s %s %s %s %d", "6/30/2025 10:54:49 PM", "DEBUG", "count", "count2", "count3 =", 5],
    )
  })

  test("do not false assert", () => {
    vi.clearAllMocks()
    handler.assert(true, structuredClone(log))
    expect(receiver.assert).toHaveBeenCalledWith(...[true, "%s %s %s", "6/30/2025 10:54:49 PM", "ERR", "log message"])
  })

  test("supports date getter passing", () => {
    vi.clearAllMocks()
    handler.setDateGetter((_) => `abobus`)
    handler.debug(structuredClone(log))
    expect(receiver.debug).toHaveBeenCalledWith(...["%s %s %s", "abobus", "DEBUG", "log message"])
  })
})
