import { Handler, Log } from "./types"
import { replaceDataBeforeStringify } from "../util/dataReplacer"
import { extractNonFormatChars, stringMatchesVar } from "../util/string"

interface TextLogHandler extends Handler {
    messageFormat: string
}

interface TextLogHandlerOptions {
    linkArguments?: boolean
    /** replace value during stringify, return null to fallback on JSONHandler replacer */
    replaceBeforeStringify?: (value: any) => any
}

export function NewTextHandler(send: (data: string) => void, options: TextLogHandlerOptions = {}): TextLogHandler {
    return new (class TextLog implements TextLogHandler {
        public skipDeepCopyWhenSendingLog = true
        public messageFormat = "%t %l %a | %w"

        constructor(private options: TextLogHandlerOptions) {}

        private get linkArguments(): boolean {
            return this.options.linkArguments !== undefined && !this.options.linkArguments
        }

        log(log: Log) {
            this.sendLog(log)
        }

        private sendLog(log: Log) {
            let args = ""
            let withArgs = ""
            let msg = this.messageFormat
            if (log.args) {
                args = this.composeVariablesString(log.args)
            }
            if (log.withArgs) {
                withArgs = this.composeVariablesString(log.withArgs)
            }
            if (!withArgs) {
                msg = msg.slice(0, msg.indexOf("%a") + 2)
            }
            send(
                msg
                    .replace("%w", withArgs)
                    .replace("%a", args)
                    .replace("%l", log.level)
                    .replace("%t", this.prepareDate(log.timestamp as number)),
            )
        }

        private composeVariablesString(data: Array<any>): string {
            let str = ""
            let excluded = extractNonFormatChars(this.messageFormat)

            for (let i = 0; i < data.length; i++) {
                let last = i === data.length - 1
                let nextIsNotLinked = typeof data[i + 1] === "string" && stringMatchesVar(data[i + 1], excluded)
                let v = data[i]

                if (
                    !this.linkArguments &&
                    !last &&
                    typeof v === "string" &&
                    stringMatchesVar(v, excluded) &&
                    !nextIsNotLinked
                ) {
                    str += `${v}=${this.formatValue(data[i + 1])} `
                    i += 1
                    continue
                }

                str += `${this.formatValue(v)}${last ? "" : " "}`
            }

            return str.trim()
        }

        private formatValue(v: any): string {
            if (this.options.replaceBeforeStringify) {
                let val = this.options.replaceBeforeStringify(v)
                if (val !== null) {
                    return val
                }
            }

            if (typeof v === "symbol") {
                return v.toString()
            }

            if (v instanceof Set) {
                return `Set[${Array.from(v)}]`
            }

            if (Array.isArray(v)) {
                return `[${v}]`
            }

            if (typeof v === "string") {
                return `${v}`
            }

            return JSON.stringify(v, (_, data: any) => replaceDataBeforeStringify(data))
        }

        private substituteMessage(msg: string) {}

        private prepareDate(t: number) {
            let d = new Date(t)
            return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
        }
    })(options)
}
