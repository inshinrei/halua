import type { Feature, SpanFlowApi } from "../types"

function flattenCtx(ctx?: Record<string, unknown>): any[] {
    if (ctx == null || typeof ctx !== "object" || Array.isArray(ctx)) {
        return []
    }
    let pairs: any[] = []
    let keys = Object.keys(ctx)
    for (let k of keys) {
        pairs.push(k, ctx[k])
    }
    return pairs
}

function isThenable(v: any): v is Promise<any> {
    return v != null && typeof v.then === "function"
}

export function spanFlow(): Feature<SpanFlowApi> {
    return {
        apply(host) {
            let flow = (name: string, ctx?: Record<string, unknown>) => {
                return host.child("flow", name, ...flattenCtx(ctx))
            }

            let closeSuccess = (log: any, label: string, start: number): number => {
                let elapsedMs = performance.now() - start
                log.info("done", { span: label, elapsedMs })
                return elapsedMs
            }

            let closeFailure = (log: any, label: string, start: number, err: unknown): number => {
                let elapsedMs = performance.now() - start
                if (err instanceof Error) {
                    log.error(err, { span: label, elapsedMs })
                } else {
                    log.warn("never-happen", { span: label, elapsedMs, err })
                }
                return elapsedMs
            }

            let startSpan = (label: string) => {
                let log = host.child("span", label)
                let start = performance.now()
                log.info("start", { span: label })
                return { log, start }
            }

            let span = (label: string, fn?: (log: any) => any): any => {
                if (typeof fn !== "function") {
                    let started = startSpan(label)
                    let ended = false
                    let duration = 0
                    return () => {
                        if (ended) {
                            return duration
                        }
                        ended = true
                        duration = closeSuccess(started.log, label, started.start)
                        return duration
                    }
                }
                let started = startSpan(label)
                try {
                    let result = fn(started.log)
                    if (isThenable(result)) {
                        return result.then(
                            (value) => {
                                closeSuccess(started.log, label, started.start)
                                return value
                            },
                            (err) => {
                                closeFailure(started.log, label, started.start, err)
                                throw err
                            },
                        )
                    }
                    closeSuccess(started.log, label, started.start)
                    return result
                } catch (err) {
                    closeFailure(started.log, label, started.start, err)
                    throw err
                }
            }

            return { flow, span }
        },
    }
}
