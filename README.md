# Halua

**A powerful, extensible logging library for Node.js, browsers, and edge runtimes.**

Halua gives you full control over log output through pluggable handlers (text, JSON, console), hierarchical child loggers, fine-grained level filtering (including minor levels like `INFO+3`), and zero-config defaults that just work.

[![npm version](https://img.shields.io/npm/v/halua.svg)](https://www.npmjs.com/package/halua)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Zero-config default logger (writes to `console` using appropriate methods)
- Three built-in handlers: `NewTextHandler`, `NewJSONHandler`, `NewConsoleHandler`
- Compose any number of handlers per logger instance
- Child loggers that automatically append context (`logger.child("user", 42)`)
- Powerful level system: `TRACE` < `DEBUG` < `INFO` < `NOTICE` < `WARN` < `ERROR` < `FATAL` + minor levels (`INFO+5`)
- Per-handler level overrides and exact-match mode
- Beautiful structured formatting for objects, arrays, Maps, Sets, Errors, etc.
- Safe by design — handler errors never crash your application
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
halua.error(new Error("timeout"))
```

**Default output (console):**

```
22/05/2026 21:55:50 INFO Application started
22/05/2026 21:55:50 WARN Disk space low { available: '12%' }
22/05/2026 21:55:50 ERROR Error: timeout
    at ...
```

## Dedicated Loggers & Handlers

Use the built-in handler factories to create purpose-specific loggers:

```ts
import { halua, NewTextHandler, NewJSONHandler, Level } from "halua"

// Text logger (human readable)
let textLogger = halua.create(NewTextHandler((line) => sendToLogServer(line)))

// JSON logger (for structured ingestion)
let jsonLogger = halua.create(NewJSONHandler((json) => writeToArchive(json)))

// Console logger (explicit)
let consoleLogger = halua.create(NewConsoleHandler(console))

textLogger.info("user action", { id: 123, type: "click" })
// -> 22/05/2026 21:55:50 INFO user action { id: 123, type: "click" }

jsonLogger.info("structured", { success: true })
// -> {"timestamp":"2026-05-22T18:55:50.430Z","level":"INFO","args":["structured",{"success": true}]}
```

You can pass an array to use **multiple handlers at once**:

```ts
let prodLogger = halua.create([NewTextHandler(sendToFile), NewJSONHandler(sendToElastic)], { level: Level.Info })
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

// Instance level (affects all handlers that don't override)
let logger = halua.create({ level: Level.Warn })

logger.debug("hidden")
logger.info("hidden")
logger.warn("visible")
logger.error("visible")
```

### Per-Handler Levels

```ts
let logger = halua.create([
    NewTextHandler(sendToFile, { level: Level.Info }),
    NewJSONHandler(sendToMetrics, { level: Level.Error }),
])
```

### Minor / Custom Levels

Use the `LEVEL+N` syntax for fine-grained control (e.g. sampling, feature flags):

```ts
let logger = halua.create(NewTextHandler(out), { level: `${Level.Info}+2` })

logger.logTo("INFO+1", "sampled out")
logger.logTo("INFO+2", "important info") // logged
logger.logTo("INFO+3", "very important") // logged
logger.logTo("WARN", "always higher major level") // logged
```

You can also pass string levels directly: `{ level: "ERROR+7" }` or `logTo("DEBUG+10", ...)`.

## Handler Options

All `New*Handler` factories accept a second `options` argument:

| Option           | Type                     | Default     | Description                                                         |
| ---------------- | ------------------------ | ----------- | ------------------------------------------------------------------- |
| `level`          | `LogLevel`               | `undefined` | Minimum level this handler accepts                                  |
| `exact`          | `LogLevel \| LogLevel[]` | `null`      | Only log these exact levels (ignores normal hierarchy)              |
| `printTimestamp` | `boolean`                | `true`      | Include timestamp in output                                         |
| `printLevel`     | `boolean`                | `true`      | Include level name in output                                        |
| `spacing`        | `boolean`                | `true`      | Pretty-print objects/arrays with tabs & newlines (Text & JSON only) |

`NewConsoleHandler` does not support `spacing` (it passes values directly to console methods).

## API Reference

### Main Export

```ts
import { halua, Level, NewTextHandler, NewJSONHandler, NewConsoleHandler } from "halua"
```

- `halua` — default logger instance (preconfigured with `NewConsoleHandler`)
- `Level` — enum: `Trace | Debug | Info | Notice | Warn | Error | Fatal`
- `NewTextHandler(send: (line: string) => void, options?)` → factory
- `NewJSONHandler(send: (json: string) => void, options?)` → factory
- `NewConsoleHandler(console: {debug,info,warn,error}, options?)` → factory

### Advanced Exports (for custom handler authors)

```ts
import { HandlerBase, format, getType, toJSONValue, Handler, HaluaLogger } from "halua"
```

- `HandlerBase` — extendable base class implementing `dispatch(meta, args)` + timestamp/level prefixing; override via `formatArg`
- `format(spec: {type, value, ...})` — the text pretty-printer (handles circulars, Errors, Maps, etc.)
- `getType(value)` — returns `ArgumentType` discriminant for any JS value
- `toJSONValue(value)` — converts any value to a JSON-legal tree (Errors → {name,message,stack[]}, etc.)
- `Handler` — interface for raw custom handlers (`dispatch(meta, args): void`)
- `HaluaLogger` — the logger instance interface

### Logger Instance Methods

| Method                                                                 | Description                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `.create(handler?, options?)`                                          | Create a new independent logger (inherits handlers/options when partial) |
| `.child(...args)`                                                      | Create child logger that appends context to every message                |
| `.setHandlers(handler \| handlers[])`                                  | Replace all handlers                                                     |
| `.appendHandlers(...)`                                                 | Add more handlers to existing set                                        |
| `.logTo(level, ...args)`                                               | Log at a custom / minor level                                            |
| `.trace / .debug / .info / .warn / .notice / .error / .fatal(...args)` | Standard levels                                                          |
| `.assert(condition, ...args)`                                          | Log at ERROR level only when `condition` is falsy                        |

Every method returns a new `HaluaLogger` when using `.create` / `.child`, so they are fully chainable.

## Error Handling

Halua never throws from logging calls. If a handler fails, the error is reported via `console.error` (best-effort) and logging continues for other handlers.

## Advanced / Custom Handlers

Extend `HandlerBase` (and set `formatArg` using the exported `format` + `getType`, or `toJSONValue` for structured) to write custom handlers for files, remote services, pretty printers, etc.

```ts
import { halua, HandlerBase, format, getType, toJSONValue, NewTextHandler } from "halua"

function NewFileHandler(sendLine) {
    return () =>
        new (class FileHandler extends HandlerBase {
            constructor(send) {
                super(send)
                this.formatArg = (v) => format({ type: getType(v), value: v }, /*spacing*/ true)
            }
        })(sendLine)
}

let fileLogger = halua.create(NewFileHandler(appendToFile))
```

The `Handler` interface (`dispatch(meta, args)`) + `HandlerBase` + `format`/`getType`/`toJSONValue` are the public extension surface. See `src/main/handlers/TextHandler.ts`, `JSONHandler.ts` for reference implementations.

**Semver note for custom handlers**: `Handler`, `dispatch`, `HandlerBase`, and the formatter trio are stable within a major version. Changes that would break existing custom `Handler` implementations are released only as majors and recorded in `docs/dr.md`.

For most use cases the three built-in handlers are sufficient.

## TypeScript

Full TypeScript support included. All types are exported.

## License

MIT © [inshinrei](https://github.com/inshinrei)

---

**See also:** [Tour of Halua](./docs/tour_of_halua.md) for a narrative deep dive and decision records in `docs/dr.md`.
