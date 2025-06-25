import type { Handler, Logger } from './types'

export class HandlerJSON implements Handler {
  constructor(private send: (data: string) => void) {}

  public debug(message: string, timestamp: string, variables: Record<string, any>): void {
    this.log(message, 'DEBUG', timestamp, variables)
  }

  public info(message: string, timestamp: string, variables: Record<string, any>): void {
    this.log(message, 'INFO', timestamp, variables)
  }

  public warn(message: string, timestamp: string, variables: Record<string, any>): void {
    this.log(message, 'WARN', timestamp, variables)
  }

  public error(message: string, timestamp: string, variables: Record<string, any>): void {
    this.log(message, 'ERR', timestamp, variables)
  }

  private log(message: string, level: string, timestamp: string, variables: Record<string, any>): void {
    let o = {
      time: timestamp,
      msg: message,
      variables,
      level,
    }
    try {
      let result = JSON.stringify(o)
      this.send(result)
    } catch (_) {}
  }
}

export function JSONHandler(send: (value: string) => void) {
  return new HandlerJSON(send)
}
