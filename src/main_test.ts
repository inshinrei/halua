import { afterEach, describe, expect, test, vi } from "vitest"
import { Halua } from "./main"
import { Level } from "./handlers/types"
import type { HaluaLogger } from "./types"
import { arrayed } from "./util/array"

describe("Halua Logger", () => {
    let halua = new Halua([])

    function makeHandler(receiver: any) {
        return () => receiver
    }

    let r1 = {
        log: vi.fn(),
    }
    let r2 = {
        log: vi.fn(),
    }

    afterEach(vi.clearAllMocks)

    test("invokes handler", () => {
        let logger = halua.New(makeHandler(r1))
        logger.info("logs info")
        expect(r1.log).toHaveBeenCalledTimes(1)
    })

    test("creates new instance with multiple handlers", () => {
        let logger = halua.New([makeHandler(r1), makeHandler(r2)])
        logger.info("logs")
        expect(r1.log).toHaveBeenCalledTimes(1)
        expect(r2.log).toHaveBeenCalledTimes(1)
    })

    test("creates new instance with options as first argument, inherits the handler", () => {
        let logger = halua.New(makeHandler(r1))
        let logger2 = logger.New({ level: Level.Debug })
        logger2.info("logs")
        expect(r1.log).toHaveBeenCalledTimes(1)
    })

    test("appends withArgs by With method", () => {
        let withArgs = ["string", [1, 2, 3], 1]
        let logger = halua.New(makeHandler(r1)).With(...withArgs)
        logger.info("logs")
        expect(r1.log).toHaveBeenCalledWith(expect.objectContaining({ withArgs }))
    })

    test("do not false assert", () => {
        let logger = halua.New(makeHandler(r1))
        logger.assert(true, "assertion")
        expect(r1.log).not.toHaveBeenCalled()
        logger.assert(false, "assertion")
        expect(r1.log).toHaveBeenCalledTimes(1)
    })

    describe("instance creation", () => {
        test("creates instance by calling New", () => {
            let logger = halua.New(makeHandler(r1))
            let logger2 = halua.New([makeHandler(r1), makeHandler(r2)])
            let logger3 = halua.With("string")
            expect(Object.is(logger, halua)).toBeFalsy()
            expect(Object.is(logger2, halua)).toBeFalsy()
            expect(Object.is(logger3, halua)).toBeFalsy()
        })

        test("implies handlers of previous instance", () => {
            let logger = halua.New(makeHandler(r1))
            let nextLogger = logger.New()
            nextLogger.info("logs")
            expect(r1.log).toHaveBeenCalledTimes(1)
        })

        test("new instance does not point on prev handlers", () => {
            let logger = halua.New(makeHandler(r1))
            let nextLogger = logger.New()
            logger.setHandler(makeHandler(r2))
            logger.info("logger log")
            nextLogger.info("nextLogger log")
            expect(r1.log).toHaveBeenCalledTimes(1)
            expect(r2.log).toHaveBeenCalledTimes(1)
        })

        test("new instance does not point on prev options", () => {
            let logger = halua.New(makeHandler(r1), { messageFormat: "%t %l" })
            let nextLogger = logger.New()
            nextLogger.withMessageFormat("%l %t")
            nextLogger.info("nextLogger log")
            expect(r1.log).toHaveBeenCalledWith(expect.objectContaining({ messageFormat: "%l %t" }))
            logger.info("logger log")
            expect(r1.log).toHaveBeenCalledWith(expect.objectContaining({ messageFormat: "%t %l" }))
        })
    })

    describe("logging", () => {
        test("message format is passed to handlers", () => {
            let logger = halua.New(makeHandler(r1)).withMessageFormat("%t %l %a")
            logger.info("logs info")
            expect(r1.log).toHaveBeenCalledWith(expect.objectContaining({ messageFormat: "%t %l %a" }))
        })

        test("logTo method sends log to specified level", () => {
            let logger = halua.New(makeHandler(r1))
            logger.logTo(Level.Info, "string")
            expect(r1.log).toHaveBeenNthCalledWith(1, expect.objectContaining({ level: Level.Info }))
            vi.clearAllMocks()
            logger.logTo(Level.Warn, "string")
            expect(r1.log).toHaveBeenNthCalledWith(1, expect.objectContaining({ level: Level.Warn }))
        })
    })

    describe("level controls", () => {
        test("turns off logging for levels, lower than required", () => {
            function log(l: HaluaLogger) {
                l.debug("logs")
                l.info("logs info")
                l.warn("logs warning")
                l.error("logs error")
            }

            log(halua.New(makeHandler(r1), { level: Level.Debug }))
            log(halua.New(makeHandler(r1), { level: Level.Info }))
            log(halua.New(makeHandler(r1), { level: Level.Warn }))
            log(halua.New(makeHandler(r1), { level: Level.Error }))
            expect(r1.log).toHaveBeenNthCalledWith(1, expect.objectContaining({ level: Level.Debug }))
            expect(r1.log).toHaveBeenNthCalledWith(2, expect.objectContaining({ level: Level.Info }))
            expect(r1.log).toHaveBeenNthCalledWith(3, expect.objectContaining({ level: Level.Warn }))
            expect(r1.log).toHaveBeenNthCalledWith(4, expect.objectContaining({ level: Level.Error }))
        })

        test("handlers' level takes priority on sending", () => {
            let logfn = vi.fn()

            function NewHandler() {
                return () => ({
                    level: Level.Warn,
                    log: logfn,
                })
            }

            let logger = halua.New(NewHandler(), { level: Level.Info })
            logger.debug("debug message")
            logger.info("info message")
            logger.warn("warn message")
            expect(logfn).toHaveBeenCalledTimes(1)
        })

        test("custom level can be set", () => {
            let logfn = vi.fn()

            function NewHandler() {
                return () => ({
                    log: logfn,
                })
            }

            let logger = halua.New(NewHandler(), { level: Level.Info + 1 })
            logger.info("info message")
            expect(logfn).not.toHaveBeenCalled()
            logger.logTo(Level.Info + 2, "test")
            expect(logfn).toHaveBeenCalledTimes(1)
        })

        test("custom level correctly behaves with handler's level", () => {
            let logfn = vi.fn()

            function NewHandler() {
                return () => ({
                    log: logfn,
                    level: "ERROR+2",
                })
            }

            let logger = halua.New(NewHandler(), { level: "FATAL" })
            logger.logTo(Level.Error + 5, "test")
            expect(logfn).toHaveBeenCalledTimes(1)
        })

        test("exact option of a handler exactly receive its levels", () => {
            let logfn = vi.fn()

            function NewHandler(value: string | Array<string>) {
                return () => ({
                    log: logfn,
                    exact: arrayed(value),
                })
            }

            let logger = halua.New(NewHandler("INFO+5"))
            logger.debug("debug message")
            logger.info("info message")
            logger.warn("warn message")
            logger.logTo("INFO+5", "info")
            expect(logfn).toHaveBeenCalledTimes(1)
            vi.clearAllMocks()

            let logger2 = halua.New(NewHandler(["INFO+1", "WARN+77"]))
            logger2.debug("debug message")
            logger2.info("info message")
            logger2.warn("warn message")
            logger2.logTo("INFO+1")
            logger2.logTo("WARN+77")
            expect(logfn).toHaveBeenCalledTimes(2)
        })
    })

    describe("custom handler", () => {
        let logfn = vi.fn()

        test("allows arrow declarations for handler", () => {
            class CustomHandler {
                log = (...args: any[]) => {
                    logfn(...args)
                }
            }

            let logger = halua.New(() => new CustomHandler())
            logger.info("message")
            expect(logfn).toHaveBeenCalledTimes(1)
        })

        test("allows func declarations for handler", () => {
            class CustomHandler {
                log(...args: any[]) {
                    logfn(...args)
                }
            }

            let logger = halua.New(() => new CustomHandler())
            logger.debug("debug message")
            expect(logfn).toHaveBeenCalledTimes(1)
        })
    })
})
