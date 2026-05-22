Next release: minor

### Handler method renamed from `handle` to `dispatch`
- The primary method on the `Handler` interface (and `HandlerBase`) has been renamed from `handle(meta, args)` to `dispatch(meta, args)`.
- This affects anyone directly implementing `Handler` or overriding the method in a subclass of `HandlerBase`.
- Call sites inside `HandlersBalancer` and all built-in handlers (`NewTextHandler` via inheritance, `NewJSONHandler`, `NewConsoleHandler`) were updated.
- This is a breaking change for custom handler authors, hence part of the major release.

### JSON handler correctness and structured output
- `NewJSONHandler` now always emits *valid* JSON via `JSON.stringify` on a normalized value tree (no more manual escaping, no unescaped quotes/newlines, no `=>` in maps).
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

### Simplified core handler protocol (addresses IMPROVEMENT.md clause 2)
- Removed the generator-based streaming protocol (`execute` returning `Generator<YieldMessage, void, NextMessage>`, init/arg/done messages, "pass"/"done" yields, `prev`/`state[]` hand-off in Balancer).
- `Handler` interface now requires a simple synchronous `handle(meta: HandlerExecuteMeta, args: any[]): void`.
- `HandlerBase` supplies a default `handle` implementation (timestamp/level prefix + per-arg delegation via optional `formatArg`).
- `NewTextHandler` inherits it; `NewJSONHandler` and `NewConsoleHandler` provide short, obvious overrides.
- `HandlersBalancer` is now a thin level-discover + direct `h.handle(...)` loop (no more per-log generator arrays or central format injection).
- `supposeIsHandler` duck-typing and error messages updated from "execute" to "handle".
- As DX win: `HandlerBase`, `format`, `getType`, and `toJSONValue` are now re-exported so custom handlers can `extend HandlerBase` and replicate TextHandler formatting exactly (per AGENTS.md guidance).
- This was a high-impact but pure-internal restructuring. Public factory APIs, `halua` usage, `create`/`child`, level/minor/exact semantics, and all output are unchanged. Custom `Handler` implementors must migrate (documented as part of the existing "next major").
- Directly resolves the "clever" complexity, duplication (~80 lines of state machine), dead paths, and poor custom-handler ergonomics called out in IMPROVEMENT.md clause 2. The "streaming decision" benefit was never used by built-ins and is not missed.

### Clause 2 design smell fixes (minor, post-protocol simplification)
- `Halua.create(...)` brittle duck-typing (`Array.isArray` + `supposeIsHandler(..., false)` + `Object.keys(arg1).length` + dead branches) replaced by explicit `isHandlerSpec` (functions or arrays of functions); `create` logic is now clear, documented, and robust.
- Text formatter (`format.ts`) now has full cycle detection via `WeakSet` (matching JSON path `toJSONValue`); deeply nested/circular objects in `.info(obj)` no longer stack-overflow (produce `[Circular]` marker instead of `HaluaParse` lossy string).
- Eliminated decrement-to-last hacks (`len -= 1` in loops), `for..in` + `Object.keys().length` mismatch (prototype pollution risk) in favor of `Object.keys()` + `join` for arrays/objects; added internal `formatValue` + shared `seen` for recursion.
- Formatter-only utils (`spacing.ts`, `printTimes`) moved from `src/util/` into `src/main/util/` (with `extractLevels`) for consistent internal layout; old `src/util/` tree deleted.
- Empty `src/main/modules/` directory removed; package.json description updated from stale "metrics and other stuff" to reflect "intentionally small" + actual scope.
- Added text-path circular test coverage. All normal output unchanged; only error-path (circular) and untested empty-object formatting improved. No public API or semver impact.

### Testing surface expansion (addresses IMPROVEMENT.md clause 3)
- Expanded `src/index_unit.ts` e2e suite from 4 to 12 tests, adding direct captured-output verification for:
  - All three `New*Handler` factories (JSON structured shape + options, Console method routing + raw value passthrough, Text).
  - Multi-handler arrays passed to `create` (Balancer dispatch to >1).
  - `setHandlers` (replace) + `appendHandlers` (augment) at runtime.
  - Per-handler `exact: [...]` (or single) bypassing level filters.
  - `assert(boolean, ...)` only emitting on false at ERROR.
  - Error isolation: a throwing custom handler does not propagate to caller and does not prevent sibling handlers from executing (the `tryReportAnError` contract).
- Overall: 59 → 67 tests, all green. The "narrow coverage" items listed in clause 3 (handler output shapes, multi/Balancer, set/append, exact, assert, isolation) are now exercised via the public API. Chose expansion of `index_unit` over new `handlers/*_unit.ts` files for maximum integration confidence with least files.
- Formatter/property-based gaps remain for future; playground + benchmarks still need v3 port. `prepare` gate is now substantially more valuable.