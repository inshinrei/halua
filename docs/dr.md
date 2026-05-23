Next release: minor

### Performance stamping API (`.stamp` / `.stampEnd`)

- Added `.stamp(label: string, id?: any)` and `.stampEnd(id: any)` to the `HaluaLogger` interface (and thus to `halua` and all created/child loggers).
- `.stamp` records a `performance.now()` start (optionally under a caller-chosen id key) and returns a zero-arg ender function.
- Calling the returned ender or `.stampEnd(id)` computes the delta, deletes the entry (for named), and emits via `.info(label, `took ${ms}ms`)` so it flows through normal level filtering, child context (`withArgs`), and all dispatchers.
- Named ids are per-logger-instance (child loggers have isolated stamp maps); the returned ender closes over its originating logger and start time for correct context and one-shot semantics.
- Idempotent enders / repeated `stampEnd` are safe (subsequent calls are no-ops).
- Added e2e test coverage in `index_unit.ts`; no changes to dispatch protocol, levels, or formatting.
- This is a pure additive, non-breaking feature (minor release). Overwrites of in-flight same-id stamps are last-writer-wins for the map (ender still uses its captured start).

### Dispatcher terminology rename (breaking public API change)

- All public and internal "handler" names have been replaced with "dispatcher" for conceptual clarity (the objects are responsible for dispatching log records via their `dispatch` method).
- `Handler` interface → `Dispatcher`
- `HandlerExecuteMeta` → `DispatcherExecuteMeta`
- `HandlerBase` → `DispatcherBase`
- `HandlersBalancer` → `DispatchersBalancer`
- `NewConsoleHandler` / `NewJSONHandler` / `NewTextHandler` → `New*Dispatcher`
- `PassedHandler` → `PassedDispatcher`
- `setHandlers` / `appendHandlers` → `setDispatchers` / `appendDispatchers`
- Error classes `HaluaFailedToCallHandler` / `HaluaUnableToDetermineHandler` → `*Dispatcher`
- The source directory `src/main/handlers/` was renamed to `src/main/dispatchers/`
- All documentation, tests, playground, and benchmarks were updated.
- This is a **breaking change** for anyone using the public factory functions, the `Handler` type, `HandlerBase`, or the `setHandlers`/`appendHandlers` methods.
- Custom implementations of the `Dispatcher` interface or extensions of `DispatcherBase` must be migrated (the `dispatch(meta, args)` contract itself is unchanged).

### Performance reality check & hot-path improvements (addresses IMPROVEMENT.md clause 7)

- Performed the "zero allocation" audit called out in clause 7 after generator removal: remaining costs were `new Date` + locale formatting on every log line per Text/Console dispatcher (3x with multi-dispatcher) and repeated `+=` string assembly in dispatch + printTimes.
- **Timestamp caching**: Added second-granularity memoization (`lastTimestampSec`/`lastTimestampStr`) inside `DispatcherBase.formatTimestamp`. For the common case of burst logging within the same wall-clock second, Text and Console dispatchers now skip `new Date` + `toLocale*` entirely after the first log of that second. JSON dispatcher (which emits full ISO ms precision) always computes fresh (by design). This directly mitigates the "three times" per-line allocation highlighted in the critique.
- **String assembly**: Replaced all remaining hot-path `+=` loops (`DispatcherBase.dispatch` prefix+args, `printTimes` indent generator) with array `join(" ")` and native `String.repeat`. This is more GC-friendly for logs with many arguments and eliminates the last style violation of the "repeated +=" complaint.
- **Bonus consistency win**: TextDispatcher output now uses single space between timestamp and level (`...50 INFO ...`) matching `NewConsoleDispatcher` (previously double-space only in Text path). Updated README samples; no test impact (loose matches).
- No public API, type, or semver surface change. The dispatch contract and dispatcher factories are untouched. These are pure internal hot-path hygiene + one visual unification in human text output.
- Benchmarks (`pnpm bench`) and playground already v3-clean from clause 6; the improvements keep the "tiny" ethos while measurably lowering per-log work for the 90% case.
- Ties off IMPROVEMENT.md clause 7. The honest positioning remains: Halua is not competing on raw ns/op with pino; its strengths are features + size + DX + self-documenting AGENTS.md.

### Documentation & DX hygiene (addresses IMPROVEMENT.md clause 6)

- Fixed README quick-start `.error("msg", new Error(...))` example (violated AGENTS.md mandatory policy that `.error` receives an `Error` instance as first argument; strings use other levels or `.error(err)` for pure errors). Updated default output sample and added compliant patterns.
- Rewrote "Advanced / Custom Dispatchers" section in README; added full documentation + usage example for the v3 public exports: `DispatcherBase`, `format`, `getType`, `toJSONValue` (plus `Dispatcher`, `HaluaLogger`).
- Added explicit semver policy note for custom `Dispatcher` authors (stability of `dispatch` / extension surface within major; breaking changes only in majors, recorded in dr.md).
- Modernized `playground/node.ts` and `benchmarks/main_bench.js` to current v3 `dispatch` + `New*Dispatcher` + `halua.create(...)` API so `pnpm bench` and the playground execute cleanly and demonstrate real usage (no more v2 ghosts confusing readers).
- Updated `AGENTS.md` (shipped in package) Architecture Notes + Custom Dispatchers sections to remove all references to deleted generator protocol / "execute" / yields; now accurately describes `dispatch` + `DispatcherBase` + formatter exports.
- Minor polish in `docs/dr.md` historical entries (corrected `handle` → `dispatch` descriptions in protocol simplification record) and this new entry.
- Also fixed one internal test usage of the old mixed `.error("str", err)` pattern for consistency.
- No runtime or public API changes; pure documentation + DX repair. Ties off the last "still valid" items from IMPROVEMENT clause 6.

### Dispatcher method renamed from `handle` to `dispatch`

- The primary method on the `Dispatcher` interface (and `DispatcherBase`) has been renamed from `handle(meta, args)` to `dispatch(meta, args)`.
- This affects anyone directly implementing `Dispatcher` or overriding the method in a subclass of `DispatcherBase`.
- Call sites inside `DispatchersBalancer` and all built-in dispatchers (`NewTextDispatcher` via inheritance, `NewJSONDispatcher`, `NewConsoleDispatcher`) were updated.
- This is a breaking change for custom dispatcher authors, hence part of the major release.

### JSON dispatcher correctness and structured output

- `NewJSONDispatcher` now always emits _valid_ JSON via `JSON.stringify` on a normalized value tree (no more manual escaping, no unescaped quotes/newlines, no `=>` in maps).
- New `toJSONValue` (used by JSON path) converts every `ArgumentType` to a legal JSON value: Errors become `{name,message,stack: string[]}`, Maps/Sets/arrays are real structures (not pre-formatted text), dates ISO, circulars marked, etc.
- This changes the shape of `args[]` items for complex types compared to the previous (broken) output — consumers of structured logs must adapt (hence major).

### Level system robustness (post-3.0.0)

- `extractLevels` + `majorLevelCheck` now handle minor arithmetic safely (no more silent `"INFO2"` coercion footguns or crashes on custom/unknown majors like "FOO+5"; malformed forms are distinct majors)
- Updated README and tour docs to use `${Level.Info}+N` syntax instead of `Level.Info + N`
- Legacy "MAJOR2" strings still parse for backward compat; comparison is now case-insensitive and crash-proof

### Docs refresh (post-3.0.0)

- Complete rewrite of README.md as the primary user documentation with verified examples
- Rewrote `docs/tour_of_halua.md` for v3 accuracy (fixed all broken code samples from v2 era)
- Added `AGENTS.md` at repository root with strict contributor rules (let/const style, mandatory halua logging policy,
  yorozu preference, expert mode)
- `AGENTS.md` is deliberately included in the published package (`"files"`) so it lands in
  `node_modules/halua/AGENTS.md` for downstream consumers and AI agents
- All documented examples were executed against the real built `lib/` output to guarantee correctness

### Simplified core dispatcher protocol (addresses IMPROVEMENT.md clause 2)

- Removed the generator-based streaming protocol (`execute` returning `Generator<...>`, init/arg/done messages, "pass"/"done" yields, `prev`/`state[]` hand-off in Balancer).
- `Dispatcher` interface now requires a simple synchronous `dispatch(meta: DispatcherExecuteMeta, args: any[]): void`.
- `DispatcherBase` supplies a default `dispatch` implementation (timestamp/level prefix + per-arg delegation via optional `formatArg`).
- `NewTextDispatcher` inherits it; `NewJSONDispatcher` and `NewConsoleDispatcher` provide short, obvious overrides.
- `DispatchersBalancer` is now a thin level-discover + direct `h.dispatch(...)` loop.
- `supposeIsDispatcher` duck-typing and error messages updated from "execute" to "dispatch".
- As DX win: `DispatcherBase`, `format`, `getType`, and `toJSONValue` are now re-exported so custom dispatchers can `extend DispatcherBase` and replicate TextDispatcher formatting exactly (per AGENTS.md guidance).
- Follow-up rename `handle` → `dispatch` (separate DR entry) for clarity with "execute" legacy.
- This was a high-impact but pure-internal restructuring. Public factory APIs, `halua` usage, `create`/`child`, level/minor/exact semantics, and all output are unchanged. Custom `Dispatcher` implementors must migrate (documented as part of the existing "next major").
- Directly resolves the "clever" complexity, duplication (~80 lines of state machine), dead paths, and poor custom-dispatcher ergonomics called out in IMPROVEMENT.md clause 2. The "streaming decision" benefit was never used by built-ins and is not missed.

### Clause 2 design smell fixes (minor, post-protocol simplification)

- `Halua.create(...)` brittle duck-typing (`Array.isArray` + `supposeIsDispatcher(..., false)` + `Object.keys(arg1).length` + dead branches) replaced by explicit `isDispatcherSpec` (functions or arrays of functions); `create` logic is now clear, documented, and robust.
- Text formatter (`format.ts`) now has full cycle detection via `WeakSet` (matching JSON path `toJSONValue`); deeply nested/circular objects in `.info(obj)` no longer stack-overflow (produce `[Circular]` marker instead of `HaluaParse` lossy string).
- Eliminated decrement-to-last hacks (`len -= 1` in loops), `for..in` + `Object.keys().length` mismatch (prototype pollution risk) in favor of `Object.keys()` + `join` for arrays/objects; added internal `formatValue` + shared `seen` for recursion.
- Formatter-only utils (`spacing.ts`, `printTimes`) moved from `src/util/` into `src/main/util/` (with `extractLevels`) for consistent internal layout; old `src/util/` tree deleted.
- Empty `src/main/modules/` directory removed; package.json description updated from stale "metrics and other stuff" to reflect "intentionally small" + actual scope.
- Added text-path circular test coverage. All normal output unchanged; only error-path (circular) and untested empty-object formatting improved. No public API or semver impact.

### Testing surface expansion (addresses IMPROVEMENT.md clause 3)

- Expanded `src/index_unit.ts` e2e suite from 4 to 12 tests, adding direct captured-output verification for:
    - All three `New*Dispatcher` factories (JSON structured shape + options, Console method routing + raw value passthrough, Text).
    - Multi-dispatcher arrays passed to `create` (Balancer dispatch to >1).
    - `setDispatchers` (replace) + `appendDispatchers` (augment) at runtime.
    - Per-dispatcher `exact: [...]` (or single) bypassing level filters.
    - `assert(boolean, ...)` only emitting on false at ERROR.
    - Error isolation: a throwing custom dispatcher does not propagate to caller and does not prevent sibling dispatchers from executing (the `tryReportAnError` contract).
- Overall: 59 → 67 tests, all green. The "narrow coverage" items listed in clause 3 (dispatcher output shapes, multi/Balancer, set/append, exact, assert, isolation) are now exercised via the public API. Chose expansion of `index_unit` over new `dispatchers/*_unit.ts` files for maximum integration confidence with least files.
- Formatter/property-based gaps remain for future; playground + benchmarks still need v3 port. `prepare` gate is now substantially more valuable.
