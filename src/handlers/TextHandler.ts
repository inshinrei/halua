import { Handler, Level, Log } from "./types"
import { replaceDataBeforeStringify } from "../util/dataReplacer"
import { stringMatchesVar } from "../util/string"

interface TextLogHandler extends Handler {}

export function NewTextHandler(send: (data: string) => void): TextLogHandler {
  return new (class TextLog implements TextLogHandler {
    public skipDeepCopyWhenSendingLog = true

    debug(log: Log) {
      this.log({ ...log, level: Level.Debug })
    }

    info(log: Log) {
      this.log({ ...log, level: Level.Info })
    }

    warn(log: Log) {
      this.log({ ...log, level: Level.Warn })
    }

    error(log: Log) {
      this.log({ ...log, level: Level.Error })
    }

    assert(c: boolean, log: Log) {
      if (!c) {
        this.log({ ...log, level: Level.Error })
      }
    }

    private log(log: Log) {
      let args = ""
      let withArgs = ""
      if (log.args) {
        args = this.composeVariablesString(log.args)
      }
      if (log.withArgs) {
        withArgs = ` ${this.composeVariablesString(log.withArgs)}`
      }
      send(`${this.prepareDate(log.timestamp as number)} ${log.level} ${args}${withArgs}`)
    }

    private composeVariablesString(data: Array<any>): string {
      let str = ""

      for (let i = 0; i < data.length; i++) {
        let last = i === data.length - 1
        let nextIsNotLinked = typeof data[i + 1] === "string" && stringMatchesVar(data[i + 1])
        let v = data[i]

        if (!last && typeof v === "string" && stringMatchesVar(v) && !nextIsNotLinked) {
          str += `${v}=${this.formatValue(data[i + 1])} `
          i += 1
          continue
        }

        str += `${this.formatValue(v)}${last ? "" : " "}`
      }

      return str.trim()
    }

    private formatValue(v: any): string {
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

    private prepareDate(t: number) {
      let d = new Date(t)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    }
  })()
}
