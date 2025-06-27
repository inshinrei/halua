import { describe, expect, test, vi } from "vitest"
import { JSONHandler } from "./JSONHandler"

describe("JSONHandler", () => {
  test("outputs single message", () => {
    let log = {
      message: "log message",
      timestamp: "00/00/00 00:00:00",
      variables: {},
    }

    let receiver = vi.fn()
    let handler = JSONHandler(receiver)

    handler.debug(log)
    expect(receiver).toHaveBeenCalledWith(
      `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"DEBUG"}`,
    )
    handler.info(log)
    expect(receiver).toHaveBeenCalledWith(
      `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"INFO"}`,
    )
    handler.warn(log)
    expect(receiver).toHaveBeenCalledWith(
      `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"WARN"}`,
    )
    handler.error(log)
    expect(receiver).toHaveBeenCalledWith(
      `{"message":"log message","timestamp":"00/00/00 00:00:00","variables":{},"level":"ERR"}`,
    )
  })

  test("outputs message with variables", () => {})
})
