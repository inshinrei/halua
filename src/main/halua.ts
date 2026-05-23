import { HaluaLogger, HaluaOptions, PassedDispatcher } from "./types"
import { Dispatcher } from "./dispatchers/DispatcherTypes"
import { Balancer, DispatchersBalancer } from "./dispatchers/DispatchersBalancer"
import { Level, LogLevel } from "../types/log"
import { toarray } from "./util/cast"
import { tryReportAnError } from "./util/errors"
import { HaluaUnableToDetermineDispatcher } from "./errors"

export class Halua implements HaluaLogger {
    private readonly passedDispatchers: PassedDispatcher = []
    private dispatchers: Array<Dispatcher> = []
    private balancer: Balancer

    constructor(
        passed: PassedDispatcher,
        private options: HaluaOptions = {},
    ) {
        this.passedDispatchers = passed
        this.dispatchers = this.buildDispatchers(passed)

        this.balancer = new DispatchersBalancer(this.options.level || Level.Trace, this.dispatchers)
        this.bindMethods()
    }

    create(
        arg1: PassedDispatcher | HaluaOptions = this.passedDispatchers,
        arg2: HaluaOptions | undefined = this.options,
    ): HaluaLogger {
        if (this.isDispatcherSpec(arg1)) {
            return new Halua(arg1 as PassedDispatcher, { ...(arg2 ?? this.options) })
        }
        return new Halua(this.passedDispatchers, { ...(arg1 as HaluaOptions) })
    }

    child(...args: any[]): HaluaLogger {
        return new Halua(this.passedDispatchers, { ...this.options, withArgs: (this.options.withArgs || []).concat(args) })
    }

    setDispatchers(dispatcher: PassedDispatcher): void {
        this.dispatchers = this.buildDispatchers(dispatcher)
        this.updateBalancer()
    }

    appendDispatchers(dispatcher: PassedDispatcher): void {
        let dispatchers = this.buildDispatchers(dispatcher)
        this.dispatchers.push(...dispatchers)
        this.updateBalancer()
    }

    logTo(level: LogLevel, ...args: any[]): void {
        this.sendToBalancer(level, args)
    }

    trace(...args: any[]): void {
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
        this.balancer = new DispatchersBalancer(this.options.level || Level.Trace, this.dispatchers)
    }

    private sendToBalancer(level: LogLevel, args: Array<any>) {
        this.balancer.sendLog({ level, timestamp: Date.now() }, args.concat(this.options.withArgs ?? []))
    }

    private supposeIsDispatcher(v: any, reportError = true): boolean {
        /** __proto__ checks for function declaration, ownProp checks for arrow func */
        let isDispatcher =
            Object.prototype.hasOwnProperty.call(v.__proto__, "dispatch") ||
            Object.prototype.hasOwnProperty.call(v, "dispatch")
        if (!isDispatcher && reportError) {
            tryReportAnError(new HaluaUnableToDetermineDispatcher(`Unable to find dispatch method of a dispatcher`))
        }
        return isDispatcher
    }

    private isDispatcherSpec(v: any): boolean {
        if (Array.isArray(v)) {
            return v.every((x: any) => typeof x === "function")
        }
        return typeof v === "function"
    }

    private buildDispatchers(passed: PassedDispatcher): Array<Dispatcher> {
        let entries = toarray(passed)
        return entries.map((b) => b()).filter((h) => this.supposeIsDispatcher(h))
    }

    private bindMethods(): void {
        this.create = this.create.bind(this)
        this.child = this.child.bind(this)

        this.setDispatchers = this.setDispatchers.bind(this)
        this.appendDispatchers = this.appendDispatchers.bind(this)

        this.logTo = this.logTo.bind(this)
        this.trace = this.trace.bind(this)
        this.debug = this.debug.bind(this)
        this.info = this.info.bind(this)
        this.warn = this.warn.bind(this)
        this.notice = this.notice.bind(this)
        this.error = this.error.bind(this)
        this.fatal = this.fatal.bind(this)
        this.assert = this.assert.bind(this)

        this.supposeIsDispatcher = this.supposeIsDispatcher.bind(this)
    }
}
