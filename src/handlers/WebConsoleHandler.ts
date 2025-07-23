import type { Handler, Log } from "./types"
import { Level } from "./types"
import { stringMatchesVar } from "../util/string"

interface WebConsoleLogHandler extends Handler {
    setDateGetter: (getter: (timestamp: number) => string) => void
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
    withSeparator?: string
    useWarn?: boolean
    useError?: boolean
}

type ColorKey = "grey" | "green" | "blue" | "purple" | "orange" | "red"
type Colors = Map<ColorKey, string>

export function NewWebConsoleHandler(
    c: ConsoleLogHandlerConsole = console,
    options: WebConsoleHandlerOptions = {},
): WebConsoleLogHandler {
    return new (class WebConsoleLog implements WebConsoleLogHandler {
        public skipDeepCopyWhenSendingLog = true
        // extract withSeparator from here
        // public messageFormat = "%t %l %a | %w"

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
            this.options = options || {}
            this.options.fetchBrowserThemeOnInstanceCreation ??= true
            this.options.withSeparator ??= "|"

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
            let additionalArgs = []
            if (log.withArgs) {
                additionalArgs.push(this.options.withSeparator!)
                additionalArgs.push(...log.withArgs)
                delete log.withArgs
            }
            let totalArgs = [...(log.args || []), ...additionalArgs]
            if (this.options.pretty) {
                let colorKey: ColorKey =
                    log.level === Level.Debug
                        ? "purple"
                        : log.level === Level.Info
                          ? "blue"
                          : log.level === Level.Warn
                            ? "orange"
                            : "red"
                return [
                    `${this.prepareDate(log.timestamp)} %c${log.level}%c`,
                    `color:${this.options.customColors?.get(colorKey) || this.colors.get(colorKey)};`,
                    `color:${this.options.customColors?.get("green") || this.colors.get("green")}`,
                    ...totalArgs,
                ]
            }
            return [this.prepareDate(log.timestamp), `${log.level}`, ...totalArgs]
        }

        private composeConsoleSubstitution(data: Array<any>, startingVarConvertIndex = 2): string {
            let str = ""
            if (this.options.pretty) {
                startingVarConvertIndex = 2
            }
            for (let i = this.options.pretty ? startingVarConvertIndex : 0; i < data.length; i++) {
                let last = i === data.length - 1
                let v = data[i]

                let vWithEqualSign = typeof v === "string" && stringMatchesVar(v, [this.options.withSeparator!])
                let nextVWithEqualSign =
                    !last &&
                    typeof data[i + 1] === "string" &&
                    stringMatchesVar(data[i + 1], [this.options.withSeparator!])

                if (nextVWithEqualSign) {
                    startingVarConvertIndex = Math.max(startingVarConvertIndex, i)
                }

                if (!this.linkArguments && !last && i > startingVarConvertIndex && vWithEqualSign) {
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

        private prepareDate(t: number | string) {
            if (this.options.dateGetter) {
                return this.options.dateGetter(t as number)
            }
            let d = new Date(t)
            return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
        }
    })(options)
}
