import { Handler, Level, Log } from "./types"

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
      if (log.args) {
        args = this.composeVariablesString(log.args)
      }
      send(`${this.prepareDate(log.timestamp as number)} ${log.level} ${args}`)
    }

    private composeVariablesString(data: Array<any>, nested = false): string {
      let str = ""

      for (let i = 0; i < data.length; i++) {
        let last = i === data.length - 1
        let v = data[i]

        if (!last && typeof v === "string" && v.trim().indexOf(" ") === -1) {
          str += `${v}=${this.formatValue(data[i + 1])} `
          i += 1
          continue
        }

        str += `${this.formatValue(v)}${last ? "" : " "}`
      }

      return str
    }

    private formatValue(v: any): string {
      if (typeof v === "symbol") {
        return v.toString()
      }

      if (v instanceof Set) {
        return `Set[${Array.from(v)}]`
      }

      if (v instanceof Map) {
        let obj: Record<string, any> = {}
        for (let key of v.keys()) {
          obj[key] = this.formatValue(v.get(key))
        }
        return JSON.stringify(obj)
      }

      if (Array.isArray(v)) {
        return `[${v}]`
      }

      if (typeof v === "object") {
        return JSON.stringify(v)
      }

      return `${v}`
    }

    private prepareDate(t: number) {
      let d = new Date(t)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
    }
  })()
}
