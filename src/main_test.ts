import { afterEach, describe, expect, test, vi } from "vitest"
import { Halua } from "./main"
import { Level } from "./handlers/types"
import type { HaluaLogger } from "./types"

describe("Halua Logger", () => {
    let halua = new Halua([])

    let r1 = {
        log: vi.fn(),
    }
    let r2 = {
        log: vi.fn(),
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
        expect(r1.log).toHaveBeenCalledTimes(1)
    })

    test("creates new instance with multiple handlers", () => {
        let logger = halua.New([r1, r2])
        logger.info("logs")
        expect(r1.log).toHaveBeenCalledTimes(1)
        expect(r2.log).toHaveBeenCalledTimes(1)
    })

    test("creates new instance with options as first argument, inherits the handler", () => {
        let logger = halua.New(r1)
        let logger2 = logger.New({ minLevel: Level.Debug })
        logger2.info("logs")
        expect(r1.log).toHaveBeenCalledTimes(1)
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
        expect(r1.log).toHaveBeenNthCalledWith(1, expect.objectContaining({ level: Level.Debug }))
        expect(r1.log).toHaveBeenNthCalledWith(2, expect.objectContaining({ level: Level.Info }))
        expect(r1.log).toHaveBeenNthCalledWith(3, expect.objectContaining({ level: Level.Warn }))
        expect(r1.log).toHaveBeenNthCalledWith(4, expect.objectContaining({ level: Level.Error }))
    })

    test("appends withArgs by With method", () => {
        let withArgs = ["string", [1, 2, 3], 1]
        let logger = halua.New(r1).With(...withArgs)
        logger.info("logs")
        expect(r1.log).toHaveBeenCalledWith(expect.objectContaining({ withArgs }))
    })

    test("do not false assert", () => {
        let logger = halua.New(r1)
        logger.assert(true, "assertion")
        expect(r1.log).not.toHaveBeenCalled()
        logger.assert(false, "assertion")
        expect(r1.log).toHaveBeenCalledTimes(1)
    })

    test("message format change", () => {
        let logger = halua.New(r1).withMessageFormat("%l %a")
        logger.info("logs info")
        expect(r1.log).toHaveBeenCalledWith(expect.objectContaining({ messageFormat: "%l %a" }))
    })
})
