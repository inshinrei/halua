import { Handler, Level, Log } from "./types"

interface JSONLogHandler extends Handler {}

export function JSONHandler(send: (data: string) => void): JSONLogHandler {
  return new (class JSONLog implements JSONLogHandler {
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
      try {
        send(JSON.stringify(log, this.replacer))
      } catch (err) {
        if (log.level !== Level.Error) {
          this.error({
            message: `err while trying to stringify JSON ${err}`,
            timestamp: log.timestamp,
            variables: {
              err: err,
            },
          })
        }
      }
    }

    private replacer(_: string, value: any) {
      if (typeof value === "symbol") {
        return value.toString()
      }
      if (value instanceof Set) {
        return Array.from(value)
      }
      if (value instanceof Map) {
        let obj: Record<string, any> = {}
        for (let key of value.keys()) {
          obj[key] = value.get(key)
        }
        return obj
      }
      return value
    }
  })()
}
