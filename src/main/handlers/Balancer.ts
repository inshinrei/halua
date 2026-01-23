import { Level, LogLevel } from "../../types/log"
import { Handler, HandlerExecuteMeta } from "./types"
import { format } from "../format"
import { getType } from "../getType"
import { extractLevels } from "../util/string"
import { HaluaFailedToCallHandler } from "../errors"
import { arrayed } from "../util/array"
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
    sendLog: (meta: HandlerExecuteMeta, args: Array<any>) => void
    reset: () => void
}

export class HandlersBalancer implements Balancer {
    private readonly map = new Map<LogLevel, Array<Handler>>()

    constructor(
        private level: LogLevel,
        private handlers: Array<Handler>,
    ) {
        this.sendLog = this.sendLog.bind(this)
        this.reset = this.reset.bind(this)
    }

    sendLog(meta: HandlerExecuteMeta, args: Array<any>) {
        this.discover(meta.level)
        this.send(meta, args)
    }

    reset() {
        this.map.clear()
    }

    private discover(level: LogLevel) {
        if (this.map.get(level)) {
            return
        }

        let discovered: Array<Handler> = []
        this.map.set(level, discovered)
        for (let h of this.handlers) {
            if (h.exact) {
                if (arrayed(h.exact).some((l) => l === level)) {
                    discovered.push(h)
                }
                continue
            }
            if (this.canSend(level, h.level)) {
                discovered.push(h)
            }
        }
    }

    private send(meta: HandlerExecuteMeta, args: Array<any>) {
        try {
            this.sendToHandlers(meta, args)
        } catch (e) {
            tryReportAnError(new HaluaFailedToCallHandler(`Unable to call log method of a handler`, { cause: e }))
        }
    }

    private sendToHandlers(meta: HandlerExecuteMeta, args: Array<any>) {
        let generators = this.handlers.map((h) => h.execute(meta))
        generators.forEach((e) => e.next({ type: "init", value: null }))

        let state = Array.from<string | undefined>({ length: generators.length }).fill(undefined)
        for (let arg of args) {
            generators.forEach((e, i) => {
                let result = e.next({ type: "arg", value: arg, prev: state[i] })
                state[i] = undefined

                if (result.value?.type === "pass") {
                    // move format to dependencies in constructor
                    state[i] = format({ type: getType(arg), value: arg })
                }
            })
        }

        generators.forEach((e, i) => {
            e.next({ type: "done", value: null, prev: state[i] })
        })
        state = []
    }

    private canSend(l: LogLevel, to: LogLevel = this.level || Level.Trace) {
        let level = extractLevels(l)
        let toLevel = extractLevels(to)
        return this.majorLevelCheck(level[0], toLevel[0]) + this.minorLevelCheck(level[1], toLevel[1]) > 0
    }

    private majorLevelCheck(l: Level, to: Level): number {
        if (!MajorLevelMap.get(l)!.has(l)) {
            return -1
        }
        return l === to ? 0 : 1
    }

    private minorLevelCheck(l: number, to: number): number {
        return l >= to ? 1 : 0
    }
}
