import type { Handler, Logger } from './types'

export function JSONHandler(send: (value: string) => void) {
  class HandlerJSON implements Handler {
    public debug(message: string, timestamp: string): void {
      this.log(message, 'DEBUG', timestamp)
    }

    public info(message: string, timestamp: string): void {
      this.log(message, 'INFO', timestamp)
    }

    public warn(message: string, timestamp: string): void {
      this.log(message, 'WARN', timestamp)
    }

    public error(message: string, timestamp: string): void {
      this.log(message, 'ERR', timestamp)
    }

    private log(message: string, level: string, timestamp: string): void {
      let o = {
        time: timestamp,
        msg: message,
        level,
      }
      try {
        let result = JSON.stringify(o)
        send(result)
      } catch (_) {}
    }
  }

  return new HandlerJSON()
}
