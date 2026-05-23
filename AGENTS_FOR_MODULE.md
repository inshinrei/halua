# AGENTS.md

> Guidelines for AI coding agents working in projects that depend on the `halua` logging library (when the package is
> installed from npm).

This lightweight version of the contributor guide is automatically placed into `lib/AGENTS.md` during build and shipped
inside the published npm package. It contains only the information relevant to **consumers** of the library.

## Logging Policy (mandatory)

All application code that uses halua **must** route its logs through a halua logger. Never call `console.log`,
`console.info`, `console.warn`, `console.error`, `console.debug` etc. directly for business or debug logging.

- Import the ready-to-use instance: `import { halua } from "halua"`
- Or create purpose-built loggers:
  `import { halua, NewTextDispatcher, NewJSONDispatcher, NewConsoleDispatcher, Level } from "halua"`
- Use `.error(err)` **only** for `Error` instances (or subclasses). For plain messages use a regular level or
  `halua.error("message string")` — the implementation normalizes unknown values.
- Always prefer structured data as subsequent arguments: `logger.info("user action", { userId, action })`

Example (correct usage):

```ts
import { halua } from "halua"

try {
    await doSomething()
} catch (err) {
    if (err instanceof Error) {
        halua.error(err, { userId: 42, route: "/checkout" }) // meta goes to error trackers via custom dispatcher
    } else {
        halua.warn("non-error failure", err)
    }
}
```

## Public API & Common Patterns (for AI agents)

### Core exports

```ts
import {
    halua, // default Console-backed logger instance
    Level, // Trace | Debug | Info | Notice | Warn | Error | Fatal
    NewTextDispatcher,
    NewJSONDispatcher,
    NewConsoleDispatcher,
    // advanced (for custom dispatchers)
    DispatcherBase,
    Dispatcher,
    HaluaLogger,
    format,
    getType,
    toJSONValue,
    redact,
    DefaultRedactRegExp,
} from "halua"
```

### Creating dedicated loggers

```ts
let fileLogger = halua.create(
    NewTextDispatcher((line, errorMeta) => fs.appendFileSync("app.log", line + "\n")),
    {level: Level.Info, redactDataRegExp: DefaultRedactRegExp},
)

let jsonLogger = halua.create(NewJSONDispatcher(sendToElastic))
```

You can pass an array for multiple dispatchers on the same logger.

### Child contexts (recommended for request/trace scoping)

```ts
let reqLogger = halua.child("requestId", reqId, "user", userId)
reqLogger.info("starting work")
// output will contain the context pairs automatically
```

### Minor levels & sampling

```ts
logger.logTo("INFO+3", "very important event")
halua.create(dispatcher, {level: "DEBUG+2"})
```

### Redaction of secrets

Use `DefaultRedactRegExp` (covers password, token, apiKey, email, ssn, jwt, credit-card patterns, etc.) or supply your
own RegExp. Works for both text and JSON paths and for `errorMeta`.

### Timing with stamps

```ts
let end = logger.stamp("database query")
await db.query(...)
end()   // logs: ... database query took 12.34ms
```

### Error handling contract

Halua **never** throws from any logging call. Dispatcher failures are caught and reported via a best-effort
`console.error` (the original error is not lost). Your send functions can safely throw; they will be isolated.

### Custom dispatchers (advanced)

For most cases the built-in factories + your own `send` callback are sufficient.

When you truly need different formatting, framing, rotation, remote transport, etc., extend `DispatcherBase`:

```ts
import { halua, DispatcherBase, format, getType } from "halua"
import fs from "node:fs"

const NewFileDispatcher = (path: string) => () =>
    new (class extends DispatcherBase {
        constructor() {
            super((line) => fs.appendFileSync(path, line + "\n"))
            this.formatArg = (v) => format({ type: getType(v), value: v }, true)
        }
    })()
```

See the implementations of `NewTextDispatcher` / `NewJSONDispatcher` (inside the package under `lib/` or
`src/main/dispatchers/`) for the exact pattern.

`Dispatcher`, `DispatcherBase`, `format`, `getType`, and `toJSONValue` are the stable public surface for extension
authors. Breaking changes to them are only done in major releases.

## When in doubt

- Start with the default `halua` or `halua.create(New*Dispatcher(yourSendFn))`.
- Use child loggers for context instead of manually prefixing strings.
- Let halua do the formatting — feed it rich JS values (Errors, Maps, Dates, circular structures are all handled).
- Read the package README.md (shipped alongside this file) for the complete reference.

---

Follow the logging policy strictly. When the public API or recommended usage patterns change, the source of truth for
this file (`AGENTS_FOR_MODULE.md` in the repo) must be updated together with README.md and docs/tour_of_halua.md.
