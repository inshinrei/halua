import { Handler, Level, Log } from "./types"

interface TextLogHandler extends Handler {}

export function TextHandler(send: (data: string) => void): TextLogHandler {
  return new (class TextLog implements TextLogHandler {
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
      let vars = ""
      if (Object.keys(log.variables)) {
        vars = this.composeVariablesString(log.variables)
      }
      send(`${log.timestamp} ${log.level} ${log.message}${vars}`)
    }

    private composeVariablesString(data: Record<string, any>, nested = false): string {
      let str = ""
      let c = ""

      for (let key in data) {
        let v = data[key]
        if (c) {
          str += c
          c = ""
        }
        if (typeof v === "symbol") {
          c = ` ${key}="${v.toString()}"`
          continue
        }
        if (v instanceof Set) {
          c = ` ${key}="Set[${Array.from(v)}]"`
          continue
        }
        if (v instanceof Map) {
          let obj: Record<string, any> = {}
          for (let key of v.keys()) {
            obj[key] = v.get(key)
          }
          v = { ...obj }
        }
        if (Array.isArray(v)) {
          c = ` ${key}="[${v}]"`
          continue
        }
        if (typeof v === "object") {
          c = ` ${key}=${nested ? "" : '"'}{${this.composeVariablesString(v, true)} }${nested ? "" : '"'}`
          continue
        }

        c = ` ${key}="${data[key]}"`
      }
      if (c) {
        str += c
      }
      return str
    }
  })()
}
