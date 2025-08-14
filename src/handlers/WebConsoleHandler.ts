import type { Handler, Log } from "./types"
import { Level } from "./types"
import { extractTaken, getConvertStartingIndex, stringMatchesVar } from "../util/string"
import type { ColorKey, Colors } from "./webConsoleUtils"
import { getColorKey } from "./webConsoleUtils"

interface WebConsoleLogHandler extends Handler {
    setDateGetter: (getter: (timestamp: number) => string) => void
    messageFormat: Array<string>
}

interface ConsoleLogHandlerConsole {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
}

interface WebConsoleHandlerOptions {
    /** customize date output */
    dateGetter?: (timestamp: number) => string
    /** turn prettification on, adds colors to console output */
    pretty?: boolean
    linkArguments?: boolean
    /** default: true, get browser theme with window.matchMedia */
    fetchBrowserThemeOnInstanceCreation?: boolean
    /** provide custom colors map */
    customColors?: Colors
    messageFormat?: string
    useWarn?: boolean
    useError?: boolean
    level?: Level
}

export function NewWebConsoleHandler(
    c: ConsoleLogHandlerConsole = console,
    options: WebConsoleHandlerOptions = {},
): () => WebConsoleLogHandler {
    return () =>
        new (class WebConsoleLog implements WebConsoleLogHandler {
            public skipDeepCopyWhenSendingLog = false
            public messageFormat: Array<string> = []
            public level?: Level
            private readonly messageFormatRaw: string = "%t %l %a | %w"

            private readonly colors: Colors = new Map([])
            // bg chrome #fefbff
            private readonly lightColors: Colors = new Map([
                ["grey", "#565656"],
                ["green", "#224912"],
                ["blue", "#195367"],
                ["purple", "#8A228A"],
                ["orange", "#7F3E1E"],
                ["red", "#A51818"],
            ])
            // bg chrome #27242a
            private readonly darkColors: Colors = new Map([
                ["grey", "#C9C9C9"],
                ["green", "#73CE73"],
                ["blue", "#93B9E7"],
                ["purple", "#DCA4E9"],
                ["orange", "#EEC5A8"],
                ["red", "#FC9292"],
            ])

            constructor(private options: WebConsoleHandlerOptions) {
                this.level = options.level
                this.options = options || {}
                this.options.fetchBrowserThemeOnInstanceCreation ??= true

                this.messageFormatRaw = options.messageFormat ?? this.messageFormatRaw
                this.messageFormat = Array.from(extractTaken(this.messageFormatRaw))

                if (!this.options.pretty) {
                    return
                }

                if (this.options.fetchBrowserThemeOnInstanceCreation) {
                    if (window?.matchMedia && window?.matchMedia("(prefers-color-scheme: dark)").matches) {
                        this.colors = new Map(this.darkColors)
                    } else {
                        this.colors = new Map(this.lightColors)
                    }

                    delete this.options.fetchBrowserThemeOnInstanceCreation
                } else {
                    this.colors = new Map(this.lightColors)
                }
            }

            private get linkArguments(): boolean {
                return this.options.linkArguments !== undefined && !this.options.linkArguments
            }

            log(log: Log) {
                this.sendLog(log)
            }

            public setDateGetter(dateGetter: (timestamp: number) => string) {
                this.options.dateGetter = dateGetter
            }

            private sendLog(log: Log) {
                let args = this.insertInternalEntries(log)
                if (log.level === Level.Debug) {
                    c.debug(this.composeConsoleSubstitution(args), ...args)
                    return
                }
                if (log.level === Level.Warn && this.options.useWarn) {
                    c.warn(this.composeConsoleSubstitution(args), ...args)
                    return
                }
                if (log.level === Level.Error && this.options.useError) {
                    c.error(this.composeConsoleSubstitution(args), ...args)
                    return
                }
                c.info(this.composeConsoleSubstitution(args), ...args)
            }

            private insertInternalEntries(log: Log) {
                if (this.options.pretty) {
                    return this.prepareMessagePretty(log)
                }
                return this.prepareMessage(log)
            }

            private composeConsoleSubstitution(data: Array<any>, startingVarConvertIndex = 2): string {
                let str = ""
                startingVarConvertIndex = getConvertStartingIndex(this.messageFormatRaw)
                if (this.options.pretty) {
                    startingVarConvertIndex = 3
                }

                for (let i = this.options.pretty ? startingVarConvertIndex : 0; i < data.length; i++) {
                    let last = i === data.length - 1
                    let v = data[i]

                    let takenNames = extractTaken(this.messageFormatRaw)
                    let vWithEqualSign = typeof v === "string" && stringMatchesVar(v, new Set([]))
                    let nextVWithEqualSign =
                        !last && typeof data[i + 1] === "string" && stringMatchesVar(data[i + 1], new Set([]))

                    if (nextVWithEqualSign) {
                        startingVarConvertIndex = Math.max(startingVarConvertIndex, i)
                    }

                    if (
                        !this.linkArguments &&
                        !takenNames.includes(v) &&
                        !last &&
                        i > startingVarConvertIndex &&
                        vWithEqualSign
                    ) {
                        data[i] = `${v} =`
                    }

                    if (typeof v === "string") {
                        str += `%s${last ? "" : " "}`
                        continue
                    }

                    if (typeof v === "number") {
                        str += `%d${last ? "" : " "}`
                        continue
                    }

                    str += `%o${last ? "" : " "}`
                }
                return str
            }

            private prepareMessagePretty(log: Log) {
                let format = [...this.messageFormat]
                if (!log.withArgs) {
                    format = format.slice(0, format.indexOf("%a") + 1)
                }
                let message = []
                let colors = ""
                let colorKeys = []
                for (let i = 0; i <= format.length - 1; i++) {
                    if (format[i] === "%w") {
                        message.push(...(log.withArgs || []))
                        continue
                    }
                    if (format[i] === "%t") {
                        colors += `%c${this.prepareDate(log.timestamp)} `
                        colorKeys.push(`color:${this.options.customColors?.get("grey") || this.colors.get("grey")}`)
                        continue
                    }
                    if (format[i] === "%a") {
                        colors += "%c"
                        colorKeys.push(`color:${this.options.customColors?.get("green") || this.colors.get("green")}`)
                        message.push(...log.args)
                        continue
                    }
                    if (format[i] === "%l") {
                        colors += `%c${log.level}`
                        let colorKey: ColorKey = getColorKey(log.leveling![0])
                        colorKeys.push(`color:${this.options.customColors?.get(colorKey) || this.colors.get(colorKey)}`)
                        continue
                    }
                    message.push(format[i])
                }
                return [colors, ...colorKeys, ...message]
            }

            private prepareMessage(log: Log) {
                let format = [...this.messageFormat]
                if (!log.withArgs) {
                    format = format.slice(0, format.indexOf("%a") + 1)
                }
                let message = []
                for (let i = 0; i <= format.length - 1; i++) {
                    if (format[i] === "%w") {
                        message.push(...(log.withArgs || []))
                        continue
                    }
                    if (format[i] === "%t") {
                        message.push(this.prepareDate(log.timestamp))
                        continue
                    }
                    if (format[i] === "%a") {
                        message.push(...log.args)
                        continue
                    }
                    if (format[i] === "%l") {
                        message.push(log.level)
                        continue
                    }
                    message.push(format[i])
                }
                return message
            }

            private prepareDate(t: number | string) {
                if (this.options.dateGetter) {
                    return this.options.dateGetter(t as number)
                }
                let d = new Date(t)
                return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
            }
        })(options)
}
