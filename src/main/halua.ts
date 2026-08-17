import { Feature, HaluaLogger, HaluaOptions, PassedDispatcher } from "./types"
import { Dispatcher, DispatcherExecuteMeta } from "./dispatchers/dispatcher-types"
import { Balancer, DispatchersBalancer } from "./dispatchers/dispatchers-balancer"
import { Level, LogLevel } from "../types/log"
import { toarray } from "./util/cast"
import { tryReportAnError } from "./util/errors"
import { HaluaUnableToDetermineDispatcher, unknownToError } from "./errors"

const NOOP = () => {}

export function instantiate<EM = Record<string, any>, Caps = {}>(
    passed: PassedDispatcher,
    options: HaluaOptions = {},
    features: Feature<any>[] = [],
): HaluaLogger<EM, Caps> & Caps {
    return new Halua<EM>(passed, options, features) as unknown as HaluaLogger<EM, Caps> & Caps
}

export class Halua<ErrorMeta = Record<string, any>> implements HaluaLogger<ErrorMeta> {
    private readonly passedDispatchers: PassedDispatcher = []
    private readonly features: Feature<any>[] = []
    private dispatchers: Array<Dispatcher> = []
    private balancer: Balancer
    private stamps: Map<any, { label: string; start: number }> = new Map()

    // Level-aware logging methods. These are conditionally assigned to real bound impls
    // or NOOP after construction / update (using the balancer's discover/hasHandlers).
    trace!: (...args: any[]) => void
    debug!: (...args: any[]) => void
    info!: (...args: any[]) => void
    warn!: (...args: any[]) => void
    notice!: (...args: any[]) => void
    error!: (error: unknown, meta?: ErrorMeta) => void
    fatal!: (...args: any[]) => void
    assert!: (assertion: boolean, error: unknown, meta?: ErrorMeta) => void
    logTo!: (level: LogLevel, ...args: any[]) => void

    constructor(
        passed: PassedDispatcher,
        private options: HaluaOptions = {},
        features: Feature<any>[] = [],
    ) {
        this.passedDispatchers = passed
        this.features = features
        this.dispatchers = this.buildDispatchers(this.mergeFeatureDispatchers(passed))

        this.balancer = new DispatchersBalancer(this.options.level || Level.Trace, this.dispatchers)
        this.bindCoreMethods()
        this.refreshLevelMethods()
        this.applyFeatures()
    }

    create<EM = ErrorMeta>(
        arg1: PassedDispatcher | HaluaOptions = this.passedDispatchers,
        arg2: HaluaOptions | undefined = this.options,
    ): HaluaLogger<EM> {
        if (this.isDispatcherSpec(arg1)) {
            return instantiate<EM, any>(arg1 as PassedDispatcher, { ...(arg2 ?? this.options) }, this.features)
        }
        return instantiate<EM, any>(this.passedDispatchers, { ...(arg1 as HaluaOptions) }, this.features)
    }

    child(...args: any[]): HaluaLogger<ErrorMeta> {
        return instantiate<ErrorMeta, any>(
            this.passedDispatchers,
            {
                ...this.options,
                withArgs: (this.options.withArgs || []).concat(args),
            },
            this.features,
        )
    }

    setDispatchers(dispatcher: PassedDispatcher): void {
        this.dispatchers = this.buildDispatchers(this.mergeFeatureDispatchers(dispatcher))
        this.updateBalancer()
    }

    appendDispatchers(dispatcher: PassedDispatcher): void {
        let dispatchers = this.buildDispatchers(dispatcher)
        this.dispatchers.push(...dispatchers)
        this.updateBalancer()
    }

    // logTo and the level methods below are declared as properties above and assigned in refreshLevelMethods.
    // Their implementations live in the private _* methods so we can swap the public slots to NOOP.

    private _logTo(level: LogLevel, ...args: any[]): void {
        this.sendToBalancer(level, args)
    }

    private _trace(...args: any[]): void {
        this.sendToBalancer(Level.Trace, args)
    }

    private _debug(...args: any[]): void {
        this.sendToBalancer(Level.Debug, args)
    }

    private _info(...args: any[]): void {
        this.sendToBalancer(Level.Info, args)
    }

    private _warn(...args: any[]): void {
        this.sendToBalancer(Level.Warn, args)
    }

    private _notice(...args: any[]): void {
        this.sendToBalancer(Level.Notice, args)
    }

    private _error(error: unknown, meta?: ErrorMeta): void {
        let e = unknownToError(error)
        let payload: any[] = [e]
        let finalMeta = meta != null ? { ...(meta as any), error: e } : undefined
        this.sendToBalancer(Level.Error, payload, finalMeta)
    }

    private _fatal(...args: any[]): void {
        this.sendToBalancer(Level.Fatal, args)
    }

    private _assert(assertion: boolean, error: unknown, meta?: ErrorMeta): void {
        if (assertion) {
            return
        }
        let e = unknownToError(error)
        let payload: any[] = [e]
        let finalMeta = meta != null ? { ...(meta as any), error: e } : undefined
        this.sendToBalancer(Level.Error, payload, finalMeta)
    }

    stamp(label: string, id?: any): () => number {
        let start = performance.now()
        if (id != null) {
            this.stamps.set(id, { label, start })
        }
        let ended = false
        let duration = 0
        const ender = () => {
            if (ended) {
                return duration
            }
            ended = true
            if (id != null) {
                let current = this.stamps.get(id)
                if (current && current.start === start) {
                    this.stamps.delete(id)
                }
            }
            duration = this.endStamp(label, start)
            return duration
        }
        return ender
    }

    stampEnd(id: any): number | undefined {
        let entry = this.stamps.get(id)
        if (!entry) {
            return
        }
        this.stamps.delete(id)
        return this.endStamp(entry.label, entry.start)
    }

    private endStamp(label: string, start: number): number {
        let duration = performance.now() - start
        let ms = duration.toFixed(2)
        this.info(label, `took ${ms}ms`)
        return duration
    }

    private updateBalancer() {
        this.balancer = new DispatchersBalancer(this.options.level || Level.Trace, this.dispatchers)
        this.refreshLevelMethods()
    }

    private sendToBalancer(level: LogLevel, args: Array<any>, errorMeta?: any) {
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

    private mergeFeatureDispatchers(passed: PassedDispatcher): Array<() => Dispatcher> {
        let extras: Array<() => Dispatcher> = []
        for (let f of this.features) {
            if (f.contributeDispatchers) {
                extras.push(...f.contributeDispatchers())
            }
        }
        return toarray(passed).concat(extras)
    }

    private applyFeatures(): void {
        for (let f of this.features) {
            Object.assign(this, f.apply(this as any))
        }
    }

    private buildDispatchers(passed: PassedDispatcher): Array<Dispatcher> {
        let entries = toarray(passed)
        return entries.map((b) => b()).filter((h) => this.supposeIsDispatcher(h))
    }

    private bindCoreMethods(): void {
        this.create = this.create.bind(this)
        this.child = this.child.bind(this)

        this.setDispatchers = this.setDispatchers.bind(this)
        this.appendDispatchers = this.appendDispatchers.bind(this)

        this.stamp = this.stamp.bind(this)
        this.stampEnd = this.stampEnd.bind(this)

        this.supposeIsDispatcher = this.supposeIsDispatcher.bind(this)
    }

    private refreshLevelMethods(): void {
        const isEnabled = (level: LogLevel): boolean => this.balancer.hasHandlers(level)
        this.trace = isEnabled(Level.Trace) ? this._trace.bind(this) : NOOP
        this.debug = isEnabled(Level.Debug) ? this._debug.bind(this) : NOOP
        this.info = isEnabled(Level.Info) ? this._info.bind(this) : NOOP
        this.warn = isEnabled(Level.Warn) ? this._warn.bind(this) : NOOP
        this.notice = isEnabled(Level.Notice) ? this._notice.bind(this) : NOOP
        this.error = isEnabled(Level.Error) ? this._error.bind(this) : NOOP
        this.fatal = isEnabled(Level.Fatal) ? this._fatal.bind(this) : NOOP
        this.assert = isEnabled(Level.Error) ? this._assert.bind(this) : NOOP
        this.logTo = this._logTo.bind(this)
    }
}
