import type { HaluaLogger, HaluaOptions, HandlerField, PassedHandler } from "./types"
import type { Handler, Log, LogLevel } from "./handlers/types"
import { Level } from "./handlers/types"
import { toLevel } from "./util/level"
import { extractLevels } from "./util/string"

export class Halua implements HaluaLogger {
    private handlers: Array<Handler> = []
    private readonly passedHandlers: PassedHandler

    private readonly MajorLevelMap = new Map([
        [Level.Fatal, new Set([Level.Fatal])],
        [Level.Error, new Set([Level.Fatal, Level.Error])],
        [Level.Warn, new Set([Level.Fatal, Level.Error, Level.Warn])],
        [Level.Notice, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice])],
        [Level.Info, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice, Level.Info])],
        [Level.Debug, new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice, Level.Info, Level.Debug])],
        [
            Level.Trace,
            new Set([Level.Fatal, Level.Error, Level.Warn, Level.Notice, Level.Info, Level.Debug, Level.Trace]),
        ],
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

    public logTo(level: LogLevel, ...args: any[]) {
        this.executeHandlers(this.composeLog(level, true, ...args))
    }

    public trace(...args: any[]) {
        this.sendToHandler("trace", true, ...args)
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

    public notice(...args: any[]) {
        this.sendToHandler("notice", true, ...args)
    }

    public error(...args: any[]) {
        this.sendToHandler("error", true, ...args)
    }

    public fatal(...args: any[]) {
        this.sendToHandler("fatal", true, ...args)
    }

    public assert(assertion: boolean, ...args: any[]) {
        if (assertion) {
            return
        }
        this.sendToHandler("assert", assertion, ...args)
    }

    private sendToHandler(field: HandlerField, assertion = true, ...args: any[]) {
        this.executeHandlers(this.composeLog(toLevel(field), assertion, ...args))
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

    private executeHandlers(log: Log) {
        try {
            for (let h of this.handlers) {
                let logArgument = h.skipDeepCopyWhenSendingLog ? log : structuredClone(log)
                if (h.exact) {
                    if (h.exact.some((l) => l === log.level)) {
                        h.log(logArgument)
                    }
                    continue
                }
                if (this.canSend(log.leveling!, h.level)) {
                    h.log(logArgument)
                }
            }
        } catch (err) {
            if (this.options.errorPolicy === "throw") {
                throw err
            }
        }
    }

    private canSend(l: [Level, number], to: LogLevel = this.options.level || Level.Trace): boolean {
        let tol = extractLevels(to)
        return this.majorLevelCheckPassed(l[0], tol[0]) && this.minorLevelCheckPassed(l[1], tol[1])
    }

    private majorLevelCheckPassed(l: Level, to: Level): boolean {
        return this.MajorLevelMap.get(to)!.has(l)
    }

    private minorLevelCheckPassed(l: number, to: number): boolean {
        return l >= to
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
