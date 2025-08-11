import type { HaluaLogger, HaluaOptions, PassedHandler } from "./types"
import type { Handler, Log } from "./handlers/types"
import { Level } from "./handlers/types"
import { toLevel } from "./util/level"

export class Halua implements HaluaLogger {
    private handlers: Array<Handler> = []
    private readonly passedHandlers: PassedHandler

    private readonly MajorLevelMap = new Map([
        [Level.Error, new Set([Level.Error])],
        [Level.Warn, new Set([Level.Error, Level.Warn])],
        [Level.Info, new Set([Level.Error, Level.Warn, Level.Info])],
        [Level.Debug, new Set([Level.Error, Level.Warn, Level.Info, Level.Debug])],
    ])

    constructor(
        passed: PassedHandler,
        private options: HaluaOptions = {},
    ) {
        this.passedHandlers = passed
        this.options.messageFormat ??= "%t %l %a | %w"
        this.validateHandlers(this.buildHandlers(passed))
        this.handlers = this.buildHandlers(passed)
    }

    public New(
        arg1: PassedHandler | HaluaOptions = this.passedHandlers,
        arg2: HaluaOptions | undefined = this.options,
    ): HaluaLogger {
        if (Array.isArray(arg1)) {
            this.validateHandlers(this.buildHandlers(arg1))
            return new Halua(arg1 as PassedHandler, arg2)
        }
        if (this.supposeIsHandler(arg1)) {
            return new Halua(arg1 as PassedHandler, arg2)
        }
        if (Object.keys(arg1).length) {
            return new Halua(this.passedHandlers, arg1 as HaluaOptions)
        }
        this.validateHandlers(this.buildHandlers(arg1 as PassedHandler))
        return new Halua(arg1 as PassedHandler, arg2)
    }

    public With(...args: any[]): HaluaLogger {
        return new Halua(this.passedHandlers, { ...this.options, withArgs: (this.options.withArgs || []).concat(args) })
    }

    public withMessageFormat(f: string): HaluaLogger {
        this.unlinkInheritance()
        this.options.messageFormat = f
        return this
    }

    public setHandler(handler: PassedHandler) {
        this.validateHandlers(this.buildHandlers(handler))
        this.handlers = this.buildHandlers(handler)
    }

    public appendHandler(handler: () => Handler) {
        this.validateHandlers(this.buildHandlers(handler))
        this.handlers.push(...this.buildHandlers(handler))
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
        if (assertion) {
            return
        }
        this.sendToHandler("assert", assertion, ...args)
    }

    private sendToHandler(field: "debug" | "info" | "warn" | "error" | "assert", assertion = true, ...args: any[]) {
        let level = toLevel(field)
        if (!this.canSend(level)) {
            return
        }
        let log: Log = {
            timestamp: Date.now(),
            args: args || [],
            withArgs: this.options?.withArgs || null,
            messageFormat: this.options.messageFormat,
            assertion,
            level,
        }
        this.executeHandlers(log)
    }

    private executeHandlers(log: Log) {
        try {
            for (let h of this.handlers) {
                let logArgument = h.skipDeepCopyWhenSendingLog ? log : structuredClone(log)
                h.log(logArgument)
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

    private validateHandlers(v: Array<Handler>) {
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
            Object.prototype.hasOwnProperty.call(v.__proto__, "log") || Object.prototype.hasOwnProperty.call(v, "log")
        )
    }

    private unlinkInheritance(): void {
        this.options = structuredClone(this.options)
    }

    private buildHandlers(passed: PassedHandler): Array<Handler> {
        let entries = Array.isArray(passed) ? passed : [passed]
        return entries.map((v) => v())
    }
}
