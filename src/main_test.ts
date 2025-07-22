import { afterEach, describe, expect, test, vi } from "vitest"
import { Halua } from "./main"

describe("Halua Logger", () => {
    let halua = new Halua([])

    let r1 = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        assert: vi.fn(),
    }
    let r2 = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        assert: vi.fn(),
    }

    afterEach(vi.clearAllMocks)

    test("creates new instance", () => {
        let logger = halua.New()
        let loggerWith = halua.With()
        expect(Object.is(logger, halua)).toBeFalsy()
        expect(Object.is(loggerWith, halua)).toBeFalsy()
    })

    test("invokes handler", () => {
        let logger = halua.New(r1)
        logger.info("logs info")
        expect(r1.info).toHaveBeenCalledTimes(1)
    })

    test("creates new instance with multiple handlers", () => {
        let logger = halua.New([r1, r2])
        logger.info("logs")
        expect(r1.info).toHaveBeenCalledTimes(1)
        expect(r2.info).toHaveBeenCalledTimes(1)
    })

    test.todo("creates new instance with options as first argument, inherits the handler")

    test.todo("turns off logging for levels, lower than required")

    test.todo("appends withArgs by With method")
})
