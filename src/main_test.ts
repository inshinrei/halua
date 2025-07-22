import { afterEach, describe, expect, test, vi } from "vitest"
import { Halua } from "./main"
import { Level } from "./handlers/types"
import type { HaluaLogger } from "./types"

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

    test("creates new instance with options as first argument, inherits the handler", () => {
        let logger = halua.New(r1)
        let logger2 = logger.New({ minLevel: Level.Debug })
        logger2.info("logs")
        expect(r1.info).toHaveBeenCalledTimes(1)
    })

    test("turns off logging for levels, lower than required", () => {
        function log(l: HaluaLogger) {
            l.debug("logs")
            l.info("logs info")
            l.warn("logs warning")
            l.error("logs error")
        }

        log(halua.New(r1, { minLevel: Level.Debug }))
        log(halua.New(r1, { minLevel: Level.Info }))
        log(halua.New(r1, { minLevel: Level.Warn }))
        log(halua.New(r1, { minLevel: Level.Error }))
        expect(r1.debug).toHaveBeenCalledTimes(1)
        expect(r1.info).toHaveBeenCalledTimes(2)
        expect(r1.warn).toHaveBeenCalledTimes(3)
        expect(r1.error).toHaveBeenCalledTimes(4)
    })

    test("appends withArgs by With method", () => {
        let withArgs = ["string", [1, 2, 3], 1]
        let logger = halua.New(r1).With(...withArgs)
        logger.info("logs")
        expect(r1.info).toHaveBeenCalledWith(expect.objectContaining({ withArgs }))
    })
})
