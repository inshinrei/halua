# Halua

**A powerful, extensible logging library for Node.js, browsers, and edge runtimes.**

Halua gives you full control over log output through pluggable dispatchers (text, JSON, console), hierarchical child
loggers, fine-grained level filtering (including minor levels like `INFO+3`), and zero-config defaults that just work.

[![npm version](https://img.shields.io/npm/v/halua.svg)](https://www.npmjs.com/package/halua)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Zero-config default logger (writes to `console` using appropriate methods)
- Three built-in dispatchers: `NewTextDispatcher`, `NewJSONDispatcher`, `NewConsoleDispatcher`
- Compose any number of dispatchers per logger instance
- Child loggers that automatically append context (`logger.child("user", 42)`)
- Powerful level system: `TRACE` < `DEBUG` < `INFO` < `NOTICE` < `WARN` < `ERROR` < `FATAL` + minor levels (`INFO+5`)
- Per-dispatcher level overrides and exact-match mode
- Beautiful structured formatting for objects, arrays, Maps, Sets, Errors, etc.
- Safe by design — dispatcher errors never crash your application
- `.stamp(label, id?)` + `.stampEnd(id)` (or returned ender) for `performance.now`-based timing with automatic pretty
  `took X.XXms` logging
- Tiny, fast, tree-shakeable ESM + CJS + TypeScript

## Installation

```bash
npm install halua
# or
pnpm add halua
```

## Quick Start

```ts
import { halua } from "halua"

halua.info("Application started")
halua.warn("Disk space low", { available: "12%" })
halua.error("timeout") // strings accepted too (unknownToError normalizes to Error)
```

**Default output (console):**

```
22/05/2026 21:55:50 INFO Application started
22/05/2026 21:55:50 WARN Disk space low { available: '12%' }
22/05/2026 21:55:50 ERROR Error: timeout
    at ...
```

## Dedicated Loggers & Dispatchers

Use the built-in dispatcher factories to create purpose-specific loggers:

```ts
import { halua, NewTextDispatcher, NewJSONDispatcher, Level } from "halua"

// Text logger (human readable)
let textLogger = halua.create(NewTextDispatcher((line) => sendToLogServer(line)))

// JSON logger (for structured ingestion)
let jsonLogger = halua.create(NewJSONDispatcher((json) => writeToArchive(json)))

// Console logger (explicit)
let consoleLogger = halua.create(NewConsoleDispatcher(console))

textLogger.info("user action", { id: 123, type: "click" })
// -> 22/05/2026 21:55:50 INFO user action { id: 123, type: "click" }

jsonLogger.info("structured", { success: true })
// -> {"timestamp":"2026-05-22T18:55:50.430Z","level":"INFO","args":["structured",{"success": true}]}
```

You can pass an array to use **multiple dispatchers at once**:

```ts
let prodLogger = halua.create([NewTextDispatcher(sendToFile), NewJSONDispatcher(sendToElastic)], { level: Level.Info })
```

## Child Loggers (Context)

```ts
let requestLogger = halua.child("requestId", "abc-123", "user", 42)

requestLogger.info("processing started")
// -> ... INFO processing started requestId abc-123 user 42

let stepLogger = requestLogger.child("step", "validate")
stepLogger.warn("slow validation")
// -> ... WARN slow validation requestId abc-123 user 42 step validate
```

Call `.create({ withArgs: [] })` to clear context on a child.

## Level Control

```ts
import { Level } from "halua"

// Instance level (affects all dispatchers that don't override)
let logger = halua.create({ level: Level.Warn })

logger.debug("hidden")
logger.info("hidden")
logger.warn("visible")
logger.error("visible")
```

### Per-Dispatcher Levels

```ts
let logger = halua.create([
    NewTextDispatcher(sendToFile, { level: Level.Info }),
    NewJSONDispatcher(sendToMetrics, { level: Level.Error }),
])
```

### Minor / Custom Levels

Use the `LEVEL+N` syntax for fine-grained control (e.g. sampling, feature flags):

```ts
let logger = halua.create(NewTextDispatcher(out), { level: `${Level.Info}+2` })

logger.logTo("INFO+1", "sampled out")
logger.logTo("INFO+2", "important info") // logged
logger.logTo("INFO+3", "very important") // logged
logger.logTo("WARN", "always higher major level") // logged
```

You can also pass string levels directly: `{ level: "ERROR+7" }` or `logTo("DEBUG+10", ...)`.

## Sensitive Data Redaction

Pass `redactDataRegExp` (a `RegExp`) to `halua.create(options)` for the logger instance (applies to all its dispatchers) or to individual `New*Dispatcher(..., { redactDataRegExp })` (overrides the logger default).

- In strings (and strings inside arrays): all matches of the regexp are replaced by `"^_^"`
- In objects and Maps: if a _key_ matches the regexp, its value (any type) is replaced entirely by `"^_^"`
- Works for both text and structured (JSON) output, and for `errorMeta`
- Use the exported `DefaultRedactRegExp` for common PII (passwords, tokens, api keys, emails, SSNs, JWTs, credit cards, etc.) or provide your own.

```ts
import { halua, NewJSONDispatcher, DefaultRedactRegExp } from "halua"

// logger-level default (affects dispatchers without their own setting)
let prodLogger = halua.create(
    [
        NewJSONDispatcher(sendToStore),
        NewTextDispatcher(sendToFile, { level: Level.Warn }), // this one can override if needed
    ],
    { redactDataRegExp: DefaultRedactRegExp },
)

prodLogger.info("login", { user: "alice", password: "hunter2", apiKey: "sk_xxx" })
// args become: ["login", { user: "alice", password: "^_^", apiKey: "^_^" }]

prodLogger.info("token eyJhbGciOi...abc.123", "email: foo@bar.com")
// the string arg will have secrets replaced by ^_^
```

The `redact` helper is also exported for custom dispatchers or preprocessing.

## Dispatcher Options

All `New*Dispatcher` factories accept a second `options` argument:

| Option             | Type                     | Default     | Description                                                                              |
| ------------------ | ------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| `level`            | `LogLevel`               | `undefined` | Minimum level this dispatcher accepts                                                    |
| `exact`            | `LogLevel \| LogLevel[]` | `null`      | Only log these exact levels (ignores normal hierarchy)                                   |
| `printTimestamp`   | `boolean`                | `true`      | Include timestamp in output                                                              |
| `printLevel`       | `boolean`                | `true`      | Include level name in output                                                             |
| `spacing`          | `boolean`                | `true`      | Pretty-print objects/arrays with tabs & newlines (Text & JSON only)                      |
| `redactDataRegExp` | `RegExp`                 | `undefined` | Redact sensitive data in strings/arrays and by key in objects/maps (see feature section) |

`NewConsoleDispatcher` does not support `spacing` (it passes values directly to console methods).

## API Reference

### Main Export

```ts
import { halua, Level, NewTextDispatcher, NewJSONDispatcher, NewConsoleDispatcher } from "halua"
```

- `halua` — default logger instance (preconfigured with `NewConsoleDispatcher`)
- `Level` — enum: `Trace | Debug | Info | Notice | Warn | Error | Fatal`
- `NewTextDispatcher(send: (line: string, errorMeta?: Record<string, any>) => void, options?)` → factory
- `NewJSONDispatcher(send: (json: string, errorMeta?: Record<string, any>) => void, options?)` → factory
- `NewConsoleDispatcher(console: {debug,info,warn,error}, options?)` → factory

### Advanced Exports (for custom dispatcher authors)

```ts
import { DispatcherBase, format, getType, toJSONValue, Dispatcher, HaluaLogger } from "halua"
```

- `DispatcherBase` — extendable base class implementing `dispatch(meta, args)` + timestamp/level prefixing; override via
  `formatArg`
- `format(spec: {type, value, ...})` — the text pretty-printer (handles circulars, Errors, Maps, etc.)
- `getType(value)` — returns `ArgumentType` discriminant for any JS value
- `toJSONValue(value)` — converts any value to a JSON-legal tree (Errors → {name,message,stack[]}, etc.)
- `redact(value, regexp?)` — recursively redacts strings by content match and object/map values by key match (used internally by the redact feature)
- `DefaultRedactRegExp` — built-in regexp matching common sensitive keys and value patterns (password, token, email, ssn, jwt, cc, etc.)
- `Dispatcher` — interface for raw custom dispatchers (`dispatch(meta, args): void`)
- `HaluaLogger` — the logger instance interface

### Logger Instance Methods

| Method                                                        | Description                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `.create(dispatcher?, options?)`                              | Create a new independent logger (inherits dispatchers/options when partial)                                                       |
| `.child(...args)`                                             | Create child logger that appends context to every message                                                                         |
| `.setDispatchers(dispatcher \| dispatchers[])`                | Replace all dispatchers                                                                                                           |
| `.appendDispatchers(...)`                                     | Add more dispatchers to existing set                                                                                              |
| `.logTo(level, ...args)`                                      | Log at a custom / minor level                                                                                                     |
| `.trace / .debug / .info / .warn / .notice / .fatal(...args)` | Standard levels (varargs)                                                                                                         |
| `.error(error, meta?)`                                        | Log at ERROR level; first arg (unknown) is normalized to Error; optional meta Record becomes the second arg passed to dispatchers |
| `.assert(condition, error, meta?)`                            | Log at ERROR only on falsy condition; same error + optional meta semantics as .error                                              |
| `.stamp(label, id?)`                                          | Start high-res perf timer (`performance.now`); returns ender fn; optional id for `.stampEnd`                                      |
| `.stampEnd(id)`                                               | End named stamp started with same id on this logger; logs pretty `label took X.XXms`                                              |

Every method returns a new `HaluaLogger` when using `.create` / `.child`, so they are fully chainable.

`setDispatchers` and `appendDispatchers` mutate the dispatcher list on the **live instance only**. They do not update the blueprint used by later `.create(...)` or `.child(...)` calls on that same logger (those continue to inherit the dispatchers that were supplied when the logger was originally built). If you need a fresh logger with the new set, call `halua.create(newDispatchers)` (or the mutated logger's `.create(newDispatchers)`).

## Error Handling

Halua never throws from logging calls. If a dispatcher fails, the error is reported via `console.error` (best-effort)
and logging continues for other dispatchers.

### Using `errorMeta` with error trackers (Sentry, Rollbar, etc.)

The special `.error(unknown, meta?)` and `.assert(condition, unknown, meta?)` methods accept an optional second `meta`
object. When you use a custom `send` callback with `NewTextDispatcher` (or `NewJSONDispatcher`), this `meta` is
delivered as the **second argument** to your send function.

This is ideal for attaching correlation IDs, issue keys, user context, or routing hints to your error reporting service
without polluting the normal log arguments.

```ts
import * as Sentry from "@sentry/node"
import { halua, NewTextDispatcher } from "halua"

// Human-readable logs via TextDispatcher, while still forwarding
// rich errorMeta (issueKey, etc.) to your error tracker.
let errorSink = NewTextDispatcher((line, errorMeta) => {
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
        // Fallback: still surface the error even without extra context
        Sentry.captureMessage(line, "error")
    }
})

let logger = halua.create(errorSink, { level: "WARN" })

// Normal log — no meta attached (Note that .error will serialize passed string to Error)
logger.error("something odd happened")

// Critical path with traceable issue key — meta goes to the send callback
// as the second argument, completely separate from the formatted line.
logger.error(new Error("Payment declined"), {
    issueKey: "PAY-48291",
    userId: 8472,
    component: "checkout",
    requestId: "req_abc123",
})
```

The `meta` is never mixed into the formatted `args` (exception: ConsoleHandler) — it is always available as a clean
second parameter to your send function.

## Advanced / Custom Dispatchers

For simple file (or any sink) logging the easiest approach is to use a built-in factory with your own send function:

```ts
import { halua, NewTextDispatcher } from "halua"
import fs from "node:fs"

let logPath = "app.log"

let fileLogger = halua.create(
    NewTextDispatcher((line) => {
        fs.appendFileSync(logPath, line + "\n")
    }),
)
```

If you need full control (custom dispatch, different prefixing, rotation, binary framing, remote calls, etc.) extend `DispatcherBase` and use the exported `format` + `getType` (or `toJSONValue`) exactly as the built-ins do:

```ts
import { halua, DispatcherBase, format, getType, toJSONValue } from "halua"
import fs from "node:fs"

const NewFileDispatcher = (filePath: string) => {
    return () =>
        new (class FileDispatcher extends DispatcherBase {
            constructor() {
                super((line) => {
                    fs.appendFileSync(filePath, line + "\n")
                })
                this.formatArg = (v) => format({ type: getType(v), value: v }, true)
            }
        })()
}

let fileLogger = halua.create(NewFileDispatcher("app.log"), { level: "INFO" })
fileLogger.warn("something happened", { user: 42 })
```

The `Dispatcher` interface (`dispatch(meta, args)`) + `DispatcherBase` + `format`/`getType`/`toJSONValue` are the public
extension surface. See `src/main/dispatchers/TextDispatcher.ts`, `JSONDispatcher.ts` for reference implementations.

**Semver note for custom dispatchers**: `Dispatcher`, `dispatch`, `DispatcherBase`, and the formatter trio are stable
within a major version. Changes that would break existing custom `Dispatcher` implementations are released only as
majors and recorded in `docs/dr.md`.

For most use cases the three built-in dispatchers are sufficient.

## TypeScript

Full TypeScript support included. All types are exported.

## License

MIT © [inshinrei](https://github.com/inshinrei)

---

**See also:** [Tour of Halua](https://github.com/inshinrei/halua/blob/main/docs/tour_of_halua.md) for a narrative deep dive and decision records in `docs/dr.md`.
