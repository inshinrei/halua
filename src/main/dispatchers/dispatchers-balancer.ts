import { Level, LogLevel } from "../../types/log"
import { Dispatcher, DispatcherExecuteMeta } from "./dispatcher-types"
import { extractLevels } from "../util/string"
import { HaluaFailedToCallDispatcher } from "../errors"
import { tryReportAnError } from "../util/errors"

const MajorLevelMap = new Map([
    [Level.Fatal, new Set([Level.Fatal])],
    [Level.Error, new Set([Level.Fatal, Level.Error])],
    [Level.Warn, new Set([Level.Fatal, Level.Error, Level.Warn])],
    [Level.Notice, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice])],
    [Level.Info, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice, Level.Info])],
    [Level.Debug, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice, Level.Info, Level.Debug])],
    [Level.Trace, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice, Level.Info, Level.Debug, Level.Trace])],
])

export interface Balancer {
    sendLog: (meta: DispatcherExecuteMeta, args: Array<any>, errorMeta?: Record<string, any>) => void
    hasHandlers: (level: LogLevel) => boolean
}

export class DispatchersBalancer implements Balancer {
    private readonly map = new Map<LogLevel, Array<Dispatcher>>()

    constructor(
        private level: LogLevel,
        private dispatchers: Array<Dispatcher>,
    ) {
        this.sendLog = this.sendLog.bind(this)
        this.hasHandlers = this.hasHandlers.bind(this)
    }

    sendLog(meta: DispatcherExecuteMeta, args: Array<any>, errorMeta?: Record<string, any>) {
        this.discover(meta.level)
        let hs = this.map.get(meta.level) ?? []
        if (hs.length === 0) {
            return
        }
        this.send(meta, args, errorMeta)
    }

    hasHandlers(level: LogLevel): boolean {
        this.discover(level)
        let hs = this.map.get(level)
        return !!(hs && hs.length > 0)
    }

    private discover(level: LogLevel) {
        if (this.map.get(level)) {
            return
        }

        let discovered: Array<Dispatcher> = []
        this.map.set(level, discovered)
        for (let h of this.dispatchers) {
            if (h.exact) {
                if (h.exact.some((l) => l === level)) {
                    discovered.push(h)
                }
                continue
            }
            if (this.canSend(level, h.level ?? this.level)) {
                discovered.push(h)
            }
        }
    }

    private send(meta: DispatcherExecuteMeta, args: Array<any>, errorMeta?: Record<string, any>) {
        try {
            this.sendToDispatchers(meta, args, errorMeta)
        } catch (e) {
            tryReportAnError(
                new HaluaFailedToCallDispatcher(`Unable to call dispatch method of a dispatcher`, { cause: e }),
            )
        }
    }

    private sendToDispatchers(meta: DispatcherExecuteMeta, args: Array<any>, errorMeta?: Record<string, any>) {
        let hs = this.map.get(meta.level) ?? []
        for (let h of hs) {
            try {
                h.dispatch(meta, args, errorMeta)
            } catch (e) {
                tryReportAnError(
                    new HaluaFailedToCallDispatcher(`Unable to call dispatch method of a dispatcher`, { cause: e }),
                )
            }
        }
    }

    private canSend(l: LogLevel, to: LogLevel = this.level || Level.Trace) {
        let lvl = extractLevels(l)
        let toLvl = extractLevels(to)
        return this.majorLevelCheck(lvl[0], toLvl[0]) + this.minorLevelCheck(lvl[1], toLvl[1]) > 0
    }

    private majorLevelCheck(l: string, to: string): number {
        if (l === to) {
            return 0
        }
        let toSet = MajorLevelMap.get(to as Level)
        if (!toSet || !toSet.has(l as Level)) {
            return -1
        }
        return 1
    }

    private minorLevelCheck(l: number, to: number): number {
        return l >= to ? 1 : 0
    }
}
