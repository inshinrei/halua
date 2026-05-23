import { HaluaLogger, HaluaOptions, PassedDispatcher } from "./types"
import { Dispatcher, DispatcherExecuteMeta } from "./dispatchers/DispatcherTypes"
import { Balancer, DispatchersBalancer } from "./dispatchers/DispatchersBalancer"
import { Level, LogLevel } from "../types/log"
import { toarray } from "./util/cast"
import { tryReportAnError } from "./util/errors"
import { HaluaUnableToDetermineDispatcher, unknownToError } from "./errors"

export class Halua implements HaluaLogger {
    private readonly passedDispatchers: PassedDispatcher = []
    private dispatchers: Array<Dispatcher> = []
    private balancer: Balancer
    private stamps: Map<any, { label: string; start: number }> = new Map()

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
        return new Halua(this.passedDispatchers, {
            ...this.options,
            withArgs: (this.options.withArgs || []).concat(args),
        })
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

    error(error: unknown, meta?: Record<string, any>): void {
        let e = unknownToError(error)
        let payload: any[] = [e]
        this.sendToBalancer(Level.Error, payload, meta)
    }

    fatal(...args: any[]): void {
        this.sendToBalancer(Level.Fatal, args)
    }

    assert(assertion: boolean, error: unknown, meta?: Record<string, any>): void {
        if (assertion) {
            return
        }
        let e = unknownToError(error)
        let payload: any[] = [e]
        this.sendToBalancer(Level.Error, payload, meta)
    }

    stamp(label: string, id?: any): () => void {
        let start = performance.now()
        if (id != null) {
            this.stamps.set(id, { label, start })
        }
        let ended = false
        const ender = () => {
            if (ended) {
                return
            }
            ended = true
            if (id != null) {
                let current = this.stamps.get(id)
                if (current && current.start === start) {
                    this.stamps.delete(id)
                }
            }
            this.endStamp(label, start)
        }
        return ender
    }

    stampEnd(id: any): void {
        let entry = this.stamps.get(id)
        if (!entry) {
            return
        }
        this.stamps.delete(id)
        this.endStamp(entry.label, entry.start)
    }

    private endStamp(label: string, start: number): void {
        let duration = performance.now() - start
        let ms = duration.toFixed(2)
        this.info(label, `took ${ms}ms`)
    }

    private updateBalancer() {
        this.balancer = new DispatchersBalancer(this.options.level || Level.Trace, this.dispatchers)
    }

    private sendToBalancer(level: LogLevel, args: Array<any>, errorMeta?: Record<string, any>) {
        let finalArgs = args.concat(this.options.withArgs ?? [])
        let dispatchMeta: DispatcherExecuteMeta = { level, timestamp: Date.now() }
        if (this.options.redactDataRegExp) {
            dispatchMeta.redactDataRegExp = this.options.redactDataRegExp
        }
        this.balancer.sendLog(dispatchMeta, finalArgs, errorMeta)
    }

    private supposeIsDispatcher(v: any, reportError = true): boolean {
        // duck-type on the public dispatch method (sufficient for all built-in and custom Dispatcher shapes)
        let isDispatcher = typeof v?.dispatch === "function"
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

        this.stamp = this.stamp.bind(this)
        this.stampEnd = this.stampEnd.bind(this)

        this.supposeIsDispatcher = this.supposeIsDispatcher.bind(this)
    }
}
