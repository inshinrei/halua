import type { HaluaLogger, HaluaOptions } from "./types"
import type { Handler, Log } from "./handlers/types"
import { Level } from "./handlers/types"
import { toLevel } from "./util/level"

export class Halua implements HaluaLogger {
    private handlers: Array<Handler> = []

    private readonly MajorLevelMap = new Map([
        [Level.Error, new Set([Level.Error])],
        [Level.Warn, new Set([Level.Error, Level.Warn])],
        [Level.Info, new Set([Level.Error, Level.Warn, Level.Info])],
        [Level.Debug, new Set([Level.Error, Level.Warn, Level.Info, Level.Debug])],
    ])

    constructor(
        handlers: Handler | Array<Handler>,
        private options: HaluaOptions = {},
    ) {
        this.validateHandlers(handlers)
        this.handlers = Array.isArray(handlers) ? handlers : [handlers]
    }

    public New(
        arg1: Handler | Array<Handler> | HaluaOptions = this.handlers,
        arg2: HaluaOptions | undefined = this.options,
    ): HaluaLogger {
        if (Array.isArray(arg1)) {
            this.validateHandlers(arg1)
            return new Halua(arg1 as Array<Handler>, arg2)
        }
        if (this.supposeIsHandler(arg1)) {
            return new Halua(arg1 as Handler, arg2)
        }
        if (Object.keys(arg1).length) {
            return new Halua(this.handlers, arg1 as HaluaOptions)
        }
        this.validateHandlers(arg1 as Handler)
        return new Halua(arg1 as Handler, arg2)
    }

    public With(...args: any[]): HaluaLogger {
        return new Halua(this.handlers, { ...this.options, withArgs: (this.options.withArgs || []).concat(args) })
    }

    public setHandler(handler: Handler | Array<Handler>) {
        this.validateHandlers(handler)
        this.handlers = Array.isArray(handler) ? handler : [handler]
    }

    public appendHandler(handler: Handler) {
        this.validateHandlers(handler)
        this.handlers.push(handler)
    }

    public debug(...args: any[]) {
        this.sendToHandler("debug", true, ...args)
    }

    public info(...args: any[]) {
        this.sendToHandler("info", true, ...args)
    }

    public warn(...args: any[]) {
        this.sendToHandler("warn", true, ...args)
    }

    public error(...args: any[]) {
        this.sendToHandler("error", true, ...args)
    }

    public assert(assertion: boolean, ...args: any[]) {
        this.sendToHandler("assert", assertion, ...args)
    }

    private sendToHandler(field: "debug" | "info" | "warn" | "error" | "assert", condition = true, ...args: any[]) {
        if (!this.canSend(toLevel(field))) {
            return
        }
        let log: Log = {
            timestamp: Date.now(),
            args: args || [],
            withArgs: this.options?.withArgs || null,
        }
        this.executeHandlers(field, { condition, log: log })
    }

    private executeHandlers(
        field: "debug" | "info" | "warn" | "error" | "assert",
        {
            condition,
            log,
        }: {
            condition: boolean
            log: Log
        },
    ) {
        try {
            for (let h of this.handlers) {
                let logArgument = h.skipDeepCopyWhenSendingLog ? log : structuredClone(log)
                if (field === "assert") {
                    h.assert(condition, logArgument)
                }
                if (field !== "assert") {
                    h[field](logArgument)
                }
            }
        } catch (err) {
            if (this.options.errorPolicy === "throw") {
                throw err
            }
        }
    }

    private canSend(l: Level): boolean {
        return this.majorLevelCheckPassed(l)
    }

    private majorLevelCheckPassed(l: Level): boolean {
        return this.MajorLevelMap.get(this.options.minLevel || Level.Debug)!.has(l)
    }

    private validateHandlers(v: Handler | Array<Handler>) {
        let handlers = Array.isArray(v) ? v : [v]
        if (this.options.errorPolicy === "throw") {
            for (let h of handlers) {
                if (!this.supposeIsHandler(h)) {
                    throw new Error("Passed handlers does not satisfy Handler interface")
                }
            }
        }
    }

    private supposeIsHandler(v: any): boolean {
        /** __proto__ checks for function declaration, ownProp checks for arrow func */
        return (
            (v.__proto__.hasOwnProperty("debug") || v.hasOwnProperty("debug")) &&
            (v.__proto__.hasOwnProperty("info") || v.hasOwnProperty("info")) &&
            (v.__proto__.hasOwnProperty("warn") || v.hasOwnProperty("warn")) &&
            (v.__proto__.hasOwnProperty("error") || v.hasOwnProperty("error")) &&
            (v.__proto__.hasOwnProperty("assert") || v.hasOwnProperty("assert"))
        )
    }
}
