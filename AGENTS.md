# AGENTS.md

> Guidelines for AI coding agents and contributors working on the Halua logging library.

## Code Style

- Use `let` over `const` in almost all cases inside functions and blocks.
- `const` should be used **only** for:
    - Arrow functions (`const foo = () => {}`)
    - True global / module-top-level constants that are never reassigned.

Example:

```ts
let count = 0
let logger = halua.child("module")

const formatUser = (u: User) => `${u.name} <${u.email}>`

let result = compute()
```

- Keep code minimal, no unnecessary abstractions.
- Prefer readability and debuggability over cleverness.
- All public logging inside tools / apps that use halua **must** go through the halua instance (`.info`, `.error`,
  etc.). Never use `console.*` directly for application logs.

## Logging Policy (mandatory)

This project **is** the logger. When adding features or tools that need logging:

- Import and use `halua` (or a child logger) from the local package.
- Use `.error(err)` **only** when the argument is an `Error` instance (or subclass). For string messages use appropriate
  level.
- Example:

```ts
import {halua} from "./src" // or "halua" in consuming packages

try {
    riskyOperation()
} catch (err) {
    if (err instanceof Error) {
        halua.error(err)
    } else {
        halua.warn("riskyOperation failed with non-error", err)
    }
}
```

## Project Commands

- `pnpm test` / `pnpm dev` — run Vitest in watch (dev) or single run (`pnpm test run`)
- `pnpm build` — clean build with vite (outputs to `lib/`, generates .d.ts)
- `pnpm bench` — run the tinybench performance suite (uses built `lib/`)
- `pnpm prepare` — runs full test + build (executed on publish)

Always run `pnpm test run` before committing changes that affect runtime behavior.

After editing TypeScript sources, run `pnpm build` if you need to validate against the published shape or run
benchmarks.

## Architecture Notes (Expert Mode)

Halua's core is intentionally small and uses a simple synchronous
`dispatch(meta: DispatcherExecuteMeta, args: any[]): void`
protocol between `DispatchersBalancer` and `Dispatcher` implementations (see `DispatcherBase` default). The generator
streaming
protocol was removed in v3 (see `docs/dr.md`) in favor of readability and lower allocations.

- Do **not** introduce heavy abstractions or middleware layers on top of the balancer/dispatcher model without strong
  justification.
- The level system (major + minor via `LEVEL+N` syntax) is powerful — keep the `extractLevels` + `MajorLevelMap` logic
  simple and well tested.
- Error paths must never throw to user code; all dispatcher failures are routed through `tryReportAnError`.
- When considering new dispatcher types (e.g. file dispatchers, remote), design them as `NewXxxDispatcher(...)`
  factories
  returning `() => Dispatcher` (see `NewTextDispatcher` etc. for the pattern).

## Custom Dispatchers

Implementing a raw `Dispatcher` (providing `dispatch(meta, args)`) is advanced. Prefer extending `DispatcherBase` and
using
the exported `format` + `getType` (for text) or `toJSONValue` (for structured) to replicate built-in behavior exactly.

See `NewTextDispatcher` / `NewJSONDispatcher` source for the exact `class extends DispatcherBase` +
`this.formatArg = ...` pattern.
The public re-exports (`DispatcherBase`, `format`, `getType`, `toJSONValue`) make custom dispatchers practical.

If you design a new public dispatcher, export a `New*Dispatcher` factory and update both README and the tour document.

## Testing

- Unit tests live next to source as `*-unit.ts` (Vitest).
- Add tests for any new formatting, level, or dispatcher behavior.
- The `format` and `getType` functions are the most critical pieces — they must handle every `ArgumentType` correctly
  for both text and JSON paths.

## Documentation

- Keep `README.md` as the single source of truth for users.
- The `docs/tour-of-halua.md` is a deeper narrative guide — keep it in sync with README examples.
- When changing public API surface (new options, new export, behavioral change), update both documents in the same PR.
- A consumer-oriented `agents-for-module.md` (API usage, logging policy, custom dispatcher guidance) lives at the
  repo root. On every `vite build` it is copied to `lib/AGENTS.md` (and therefore shipped inside the published npm
  package under `lib/`). This is the file that AI coding agents see when they inspect an installed `halua` module.
  **Keep `agents-for-module.md` up to date** whenever public API, recommended usage patterns, or logging best
  practices for consumers change. Update it in the same PR as README / tour changes.
- The full repo `AGENTS.md` (this file) is **not** published — it contains contributor / release / repo-specific
  sections that are irrelevant to library consumers.
- Keep documentation up to date with the changes. In `docs/dr.md` add Next release: major if the changes contain
  breaking changes, keep it "minor" otherwise

## Release Process

- Version bumps happen via `npm version` / `pnpm version`.
- `postversion` pushes tag + commit.
- `prepare` hook guarantees that only tested + built artifacts are published.

Never skip the test gate.

## Decision Records

Significant architectural or API changes must have a short entry in `docs/dr.md`.

---

Follow these rules strictly. When in doubt, ask for clarification before writing code that violates the style or logging
policy.
