import type { Handler, Log, LogLevel } from "./handlers/types"
import { Level } from "./handlers/types"
import { extractLevels } from "./util/string"
import { FailedToCallHandlerLog } from "./errors"

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
    sendLog: (log: Log) => void
    reset: () => void
}

export class HandlersBalancer implements Balancer {
    private readonly map = new Map<LogLevel, Array<Handler>>()

    constructor(
        private level: LogLevel,
        private handlers: Array<Handler>,
    ) {}

    sendLog(log: Log) {
        this.discover(log.level)
        this.send(log)
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
                if (h.exact.some((l) => l === level)) {
                    discovered.push(h)
                }
                continue
            }
            if (this.canSend(extractLevels(level), h.level)) {
                discovered.push(h)
            }
        }
    }

    private send(log: Log) {
        try {
            for (let h of this.map.get(log.level) || []) {
                h.skipDeepCopyWhenSendingLog ? h.log(log) : h.log(structuredClone(log))
            }
        } catch (e) {
            throw new FailedToCallHandlerLog(`Unable to call .log method of a handler, ${e}`, { cause: e })
        }
    }

    private canSend(l: [Level, number], to: LogLevel = this.level || Level.Trace): boolean {
        let tol = extractLevels(to)
        return this.majorLevelCheckPassed(l[0], tol[0]) && this.minorLevelCheckPassed(l[1], tol[1])
    }

    private majorLevelCheckPassed(l: Level, to: Level): boolean {
        return MajorLevelMap.get(to)!.has(l)
    }

    private minorLevelCheckPassed(l: number, to: number): boolean {
        return l >= to
    }
}
