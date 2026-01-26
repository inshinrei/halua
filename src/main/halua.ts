import { HaluaLogger, HaluaOptions, PassedHandler } from "./types"
import { Handler } from "./handlers/types"
import { Balancer, HandlersBalancer } from "./handlers/Balancer"
import { Level, LogLevel } from "../types/log"
import { format } from "./format"
import { toarray } from "./util/cast"
import { tryReportAnError } from "./util/errors"
import { HaluaUnableToDetermineHandler } from "./errors"

export class Halua implements HaluaLogger {
    private readonly passedHandlers: PassedHandler = []
    private handlers: Array<Handler> = []
    private balancer: Balancer

    constructor(
        passed: PassedHandler,
        private options: HaluaOptions = {},
    ) {
        this.passedHandlers = passed
        this.handlers = this.buildHandlers(passed)

        this.balancer = new HandlersBalancer(this.options.level || Level.Trace, this.handlers, format)
        this.bindMethods()
    }

    New(
        arg1: PassedHandler | HaluaOptions = this.passedHandlers,
        arg2: HaluaOptions | undefined = this.options,
    ): HaluaLogger {
        if (Array.isArray(arg1)) {
            return new Halua(arg1 as PassedHandler, { ...arg2 })
        }
        if (this.supposeIsHandler(arg1, false)) {
            return new Halua(arg1 as PassedHandler, { ...arg2 })
        }
        if (Object.keys(arg1).length) {
            return new Halua(this.passedHandlers, { ...(arg1 as HaluaOptions) })
        }
        return new Halua(arg1 as PassedHandler, { ...arg2 })
    }

    With(...args: any[]): HaluaLogger {
        return new Halua(this.passedHandlers, { ...this.options, withArgs: (this.options.withArgs || []).concat(args) })
    }

    setHandlers(handler: PassedHandler): void {
        this.handlers = this.buildHandlers(handler)
        this.updateBalancer()
    }

    appendHandlers(handler: PassedHandler): void {
        let handlers = this.buildHandlers(handler)
        this.handlers.push(...handlers)
        this.updateBalancer()
    }

    logTo(level: LogLevel, ...args: any[]): void {
        this.sendToBalancer(level, args)
    }

    trace(...args: any[]) {
        this.sendToBalancer(Level.Trace, args)
    }

    debug(...args: any[]): void {
        this.sendToBalancer(Level.Debug, args)
    }

    info(...args: any[]): void {
        this.sendToBalancer(Level.Info, args)
    }

    warn(...args: any[]): void {
        this.sendToBalancer(Level.Warn, args)
    }

    notice(...args: any[]): void {
        this.sendToBalancer(Level.Notice, args)
    }

    error(...args: any[]): void {
        this.sendToBalancer(Level.Error, args)
    }

    fatal(...args: any[]): void {
        this.sendToBalancer(Level.Fatal, args)
    }

    assert(assertion: boolean, ...args: any[]): void {
        if (assertion) {
            return
        }
        this.sendToBalancer(Level.Error, args)
    }

    private updateBalancer() {
        this.balancer = new HandlersBalancer(this.options.level || Level.Trace, this.handlers, format)
    }

    private sendToBalancer(level: LogLevel, args: Array<any>) {
        this.balancer.sendLog({ level, timestamp: Date.now() }, args.concat(this.options.withArgs ?? []))
    }

    private supposeIsHandler(v: any, reportError = true): boolean {
        /** __proto__ checks for function declaration, ownProp checks for arrow func */
        const isHandler =
            Object.prototype.hasOwnProperty.call(v.__proto__, "execute") ||
            Object.prototype.hasOwnProperty.call(v, "execute")
        if (!isHandler && reportError) {
            tryReportAnError(new HaluaUnableToDetermineHandler(`Unable to find execute method of a handler`))
        }
        return isHandler
    }

    private buildHandlers(passed: PassedHandler): Array<Handler> {
        let entries = toarray(passed)
        return entries.map((b) => b()).filter((h) => this.supposeIsHandler(h))
    }

    private bindMethods(): void {
        this.New = this.New.bind(this)
        this.With = this.With.bind(this)

        this.setHandlers = this.setHandlers.bind(this)
        this.appendHandlers = this.appendHandlers.bind(this)

        this.logTo = this.logTo.bind(this)
        this.trace = this.trace.bind(this)
        this.debug = this.debug.bind(this)
        this.info = this.info.bind(this)
        this.warn = this.warn.bind(this)
        this.notice = this.notice.bind(this)
        this.error = this.error.bind(this)
        this.fatal = this.fatal.bind(this)
        this.assert = this.assert.bind(this)

        this.supposeIsHandler = this.supposeIsHandler.bind(this)
    }
}
