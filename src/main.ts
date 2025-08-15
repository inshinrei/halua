import type { HaluaLogger, HaluaOptions, HandlerField, PassedHandler } from "./types"
import type { Handler, Log, LogLevel } from "./handlers/types"
import { Level } from "./handlers/types"
import { toLevel } from "./util/level"
import { extractLevels } from "./util/string"
import type { Balancer } from "./HandlersBalancer"
import { HandlersBalancer } from "./HandlersBalancer"

export class Halua implements HaluaLogger {
    private handlers: Array<Handler> = []
    private readonly passedHandlers: PassedHandler
    private balancer: Balancer

    constructor(
        passed: PassedHandler,
        private options: HaluaOptions = {},
    ) {
        this.passedHandlers = passed
        this.options.messageFormat ??= "%t %l %a | %w"
        this.validateHandlers(this.buildHandlers(passed))
        this.handlers = this.buildHandlers(passed)

        this.balancer = new HandlersBalancer(this.options.level || Level.Trace, this.handlers)
    }

    New(
        arg1: PassedHandler | HaluaOptions = this.passedHandlers,
        arg2: HaluaOptions | undefined = this.options,
    ): HaluaLogger {
        if (Array.isArray(arg1)) {
            this.validateHandlers(this.buildHandlers(arg1))
            return new Halua(arg1 as PassedHandler, { ...arg2 })
        }
        if (this.supposeIsHandler(arg1)) {
            return new Halua(arg1 as PassedHandler, { ...arg2 })
        }
        if (Object.keys(arg1).length) {
            return new Halua(this.passedHandlers, { ...(arg1 as HaluaOptions) })
        }
        this.validateHandlers(this.buildHandlers(arg1 as PassedHandler))
        return new Halua(arg1 as PassedHandler, { ...arg2 })
    }

    With(...args: any[]): HaluaLogger {
        return new Halua(this.passedHandlers, { ...this.options, withArgs: (this.options.withArgs || []).concat(args) })
    }

    withMessageFormat(f: string): HaluaLogger {
        this.unlinkInheritance()
        this.options.messageFormat = f
        return this
    }

    setHandler(handler: PassedHandler) {
        this.validateHandlers(this.buildHandlers(handler))
        this.handlers = this.buildHandlers(handler)
        this.updateBalancer()
    }

    appendHandler(handler: () => Handler) {
        this.validateHandlers(this.buildHandlers(handler))
        this.handlers.push(...this.buildHandlers(handler))
        this.updateBalancer()
    }

    logTo(level: LogLevel, ...args: any[]) {
        this.balancer.sendLog(this.composeLog(level, true, ...args))
    }

    trace(...args: any[]) {
        this.sendToHandler("trace", true, ...args)
    }

    debug(...args: any[]) {
        this.sendToHandler("debug", true, ...args)
    }

    info(...args: any[]) {
        this.sendToHandler("info", true, ...args)
    }

    warn(...args: any[]) {
        this.sendToHandler("warn", true, ...args)
    }

    notice(...args: any[]) {
        this.sendToHandler("notice", true, ...args)
    }

    error(...args: any[]) {
        this.sendToHandler("error", true, ...args)
    }

    fatal(...args: any[]) {
        this.sendToHandler("fatal", true, ...args)
    }

    assert(assertion: boolean, ...args: any[]) {
        if (assertion) {
            return
        }
        this.sendToHandler("assert", assertion, ...args)
    }

    private updateBalancer() {
        this.balancer = new HandlersBalancer(this.options.level || Level.Trace, this.handlers)
    }

    private sendToHandler(field: HandlerField, assertion = true, ...args: any[]) {
        this.balancer.sendLog(this.composeLog(toLevel(field), assertion, ...args))
    }

    private composeLog(level: LogLevel, assertion: boolean, ...args: any[]): Log {
        return {
            timestamp: Date.now(),
            args: args || [],
            withArgs: this.options?.withArgs || null,
            messageFormat: this.options.messageFormat,
            assertion,
            level,
            leveling: extractLevels(level),
        }
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
