# Tour of Halua (v3)

Last updated for Halua 3.x

This document walks through real-world usage patterns beyond the quick start in the README.

## Production Application Setup Example

```ts
import { halua, NewTextDispatcher, NewJSONDispatcher, NewConsoleDispatcher, Level, DefaultRedactRegExp } from "halua"

// In a real app you would have your own transport functions
let dispatchers = [
    // High-volume structured logs -> compressed archive / object storage
    NewJSONDispatcher(writeToZipArchive, { level: Level.Info }),

    // Important events -> backend
    NewTextDispatcher(sendToServer, { level: Level.Notice }),

    // User analytics on a dedicated minor level so you can filter easily
    NewTextDispatcher(sendUserAction, { level: "INFO+1" }),

    // Critical errors -> error tracking (Sentry, etc.)
    NewTextDispatcher(sendToErrorMonitoring, { level: Level.Error }),
]

// Add pretty console output only in development
if (process.env.NODE_ENV !== "production") {
    dispatchers.push(NewConsoleDispatcher(console))
}

// Create the root logger for the whole application
let appLogger = halua.create(dispatchers, { level: Level.Info, redactDataRegExp: DefaultRedactRegExp })

// Later you can still mutate dispatchers if needed
// appLogger.appendDispatchers(NewJSONDispatcher(anotherDestination))
```

## Basic Logging Methods

```ts
import { halua } from "halua"

halua.trace("very verbose")
halua.debug("debug info")
halua.info("normal operation")
halua.warn("something suspicious")
halua.notice("notable event")
halua.error("recoverable error") // plain string also works (becomes Error("recoverable error"))
halua.fatal("unrecoverable")
halua.assert(user != null, "user must exist", { user }) // default logger accepts any meta shape (typed loggers enforce a specific interface)

// high-res timing (uses performance.now, logs via .info on end)
let end = halua.stamp("db lookup", "q42")
doQuery()
end() // or halua.stampEnd("q42")  ->  ... INFO db lookup took 3.14ms
```

## Creating Specialized Loggers

`.create(...)` is the main way to obtain new logger instances.

```ts
import { halua, NewTextDispatcher, NewJSONDispatcher, Level } from "halua"

let fileLogger = halua.create(NewTextDispatcher(appendToFile), {
    level: Level.Warn,
})

let jsonMetrics = halua.create(NewJSONDispatcher(postToCollector), {
    level: Level.Info,
})

// Combine previous dispatchers with new options
let debugFileLogger = fileLogger.create({ level: Level.Debug })
```

You can also create a logger from another dispatcher while keeping previous options:

```ts
let base = halua.create(NewTextDispatcher(send))
let jsonVersion = base.create(NewJSONDispatcher(send))
```

## Child Loggers & Structured Context

Child loggers are the recommended way to carry request/operation context.

```ts
let req = halua.child("requestId", "req_9f3a", "tenant", "acme")

req.info("started processing order", { orderId: 88321 })
// 22/05/2026 ... INFO started processing order { orderId: 88321 } requestId req_9f3a tenant acme

let step = req.child("step", "payment")
step.warn("slow payment gateway", { latencyMs: 1240 })
// ... WARN slow payment gateway { latencyMs: 1240 } requestId ... step payment
```

To reset context:

```ts
let clean = someChild.create({ withArgs: [] })
```

## Level System Deep Dive

Levels are ordered: `TRACE` < `DEBUG` < `INFO` < `NOTICE` < `WARN` < `ERROR` < `FATAL`

A message is emitted when:

1. Its **major** level is >= the configured major level, **or**
2. Majors are equal and its **minor** part is >= configured minor

```ts
let logger = halua.create({ level: `${Level.Info}+3` }) // or "INFO+3"

logger.logTo("INFO+2", "filtered") // hidden (minor too low)
logger.logTo("INFO+3", "borderline") // emitted
logger.logTo("NOTICE", "higher") // emitted (major wins)
```

You can also set `exact` on a dispatcher to bypass the hierarchy completely (useful for dedicated channels):

```ts
NewTextDispatcher(sendAudit, { exact: ["AUDIT", "SECURITY"] })
```

## Formatting Behavior

Halua produces rich, readable output for complex values:

- Objects and arrays are pretty-printed with indentation (when `spacing: true`)
- Errors include their message + stack
- `Map` / `Set` / `Date` / typed arrays / functions are described intelligently
- `WeakMap` / `WeakSet` / `ArrayBuffer` show as inaccessible (they can't be serialized safely)

JSON dispatcher produces a single-line JSON-ish object (not strict `JSON.stringify`) optimized for log shippers.

## Error Safety

```ts
let bad = halua.create(
    NewTextDispatcher(() => {
        throw new Error("boom")
    }),
)

bad.info("this will not crash the process")
```

The failure is reported to `console.error` (best effort) and other dispatchers continue working.

## Rich Error Context with typed `errorMeta`

The `.error(err, meta?)` and `.assert(condition, err, meta?)` methods accept an optional second object that travels
separately from the normal log arguments. With `NewTextDispatcher` or `NewJSONDispatcher` this value is passed as the
**second argument** to your `send` callback — keeping the formatted line clean while giving error trackers (Sentry,
Datadog, etc.) rich structured context.

Halua makes this even safer by letting you declare the shape of the meta object **per logger instance** using a generic
type parameter:

```ts
import { halua, NewTextDispatcher, Level } from "halua"
import * as Sentry from "@sentry/node"

type ErrorMonitoringMeta = {
    issueKey: string
    component?: string
    userId?: number | string
    requestId?: string
    [key: string]: unknown // allow extra fields when needed
}

// A dedicated logger that only accepts the right meta shape
let errorLogger = halua.create<ErrorMonitoringMeta>(NewTextDispatcher(sendToErrorMonitoring, { level: Level.Error }))

function sendToErrorMonitoring(line: string, errorMeta?: Record<string, any>) {
    if (errorMeta?.issueKey) {
        Sentry.captureMessage(line, {
            level: "error",
            tags: {
                issueKey: errorMeta.issueKey,
                component: errorMeta.component,
            },
            extra: errorMeta,
        })
    } else {
        Sentry.captureMessage(line, "error")
    }
}
```

Because the logger is typed, the compiler now enforces the correct shape at every call site:

```ts
errorLogger.error(new Error("Payment declined"), {
    issueKey: "PAY-48291",
    userId: 8472,
    component: "checkout",
    requestId: "req_abc123",
})

// Child loggers inherit the parent's ErrorMeta type automatically
let checkoutLogger = errorLogger.child("flow", "checkout")
checkoutLogger.assert(false, "inventory check failed", { issueKey: "INV-777" })

// @ts-expect-error — wrong field name is caught at compile time
errorLogger.error(new Error("bad"), { foo: "bar" })
```

You can create as many differently-typed error loggers as you need in the same application:

```ts
type JobErrorMeta = { jobId: string; attempt: number; queue: string }

let jobErrorLogger = halua.create<JobErrorMeta>(
    NewJSONDispatcher((json, meta) => {
        /* ... */
    }),
)
```

The generic lives only on the `Halua` / `HaluaLogger` surface. The underlying `Dispatcher` contract and your `send`
functions remain `Record<string, any>` (or `any`) so the same dispatcher factories stay reusable across all your
typed loggers. Type safety is a compile-time benefit for the call sites that produce errors; the runtime wire format
is unchanged.

This pattern gives you autocomplete, early detection of stale or misspelled context keys, and self-documenting error
channels without adding any runtime cost.

## When to Use What

| Use Case                | Recommended Approach                         |
| ----------------------- | -------------------------------------------- |
| Local dev / CLI         | Default `halua` or `NewConsoleDispatcher`    |
| Server file logs        | `NewTextDispatcher` + rotation lib           |
| Cloud / SIEM / ELK      | `NewJSONDispatcher`                          |
| Multiple destinations   | Array of dispatchers + per-dispatcher levels |
| Request tracing         | `.child(...)` everywhere                     |
| Sampling / feature logs | Minor levels (`INFO+10`, etc.)               |
| Audit / security only   | Dispatcher with `exact: [...]`               |

## Further Reading

- [README](../README.md) — installation, API table, quick reference
- `docs/dr.md` — architectural decision records
- Source in `src/main/dispatchers/` — see `DispatcherBase` + its `dispatch(meta, args)` (and the New\*Dispatcher
  factories) if you need a custom transport

Halua is intentionally small and explicit. Most applications only need a handful of logger instances created at startup.
