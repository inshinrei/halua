Next release: major

### 5.0.0 cut: LDD default logger, createHalua, stamp elapsed ms, shipped migrations

- Public release is **5.0.0** (was tracked as additive/minor while landing). Major because the default `halua` contract
  and `HaluaLogger` surface changed, not because JSON or `DispatcherExecuteMeta` broke.
- Includes unreleased work since 4.1.0: stamp ender / `stampEnd` return raw elapsed ms; `createHalua` + `Feature`
  re-apply; `spanFlow` on the default logger; opt-in `capture`.
- Durable notes: `docs/release-notes/5.0.0.md` and `docs/migrations/4.1.0-to-5.0.0.md`. The migration folder is copied
  to `lib/migrations/` on build.
- After the version tag, reset this file to `Next release: minor` (scratchpad, not the changelog).

### Injectable LDD: createHalua builder, spanFlow, capture

- New `createHalua()` fluent builder (`dispatchers`, `level`, `redact`, `withArgs`, `use`, `build`) with accumulating feature types. Existing `halua.create(dispatchers?, options?)` is unchanged.
- `Halua` stores a `Feature[]` and re-applies it in `instantiate()` on `.child()` / `.create()`. Features may add methods and optional dispatchers. No dispatch middleware.
- `spanFlow()` adds `.flow(name, ctx?)` (`child("flow", name, …pairs)`) and `.span(label, fn?)` (start/done + `elapsedMs`, or error / `never-happen` + rethrow). Default `halua` is built with `spanFlow()`.
- `capture()` is opt-in: shared `collect()` / `clear()` buffer of raw dispatch records for asserting the log story.
- Docs: LDD section in `agents-for-module.md`, contributor note in `AGENTS.md`, README + tour. Research note remains repo-only.
- Additive / minor. No JSON shape or `DispatcherExecuteMeta` change.
