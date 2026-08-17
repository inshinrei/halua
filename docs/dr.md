Next release: minor

### Injectable LDD: createHalua builder, spanFlow, capture

- New `createHalua()` fluent builder (`dispatchers`, `level`, `redact`, `withArgs`, `use`, `build`) with accumulating feature types. Existing `halua.create(dispatchers?, options?)` is unchanged.
- `Halua` stores a `Feature[]` and re-applies it in `instantiate()` on `.child()` / `.create()`. Features may add methods and optional dispatchers. No dispatch middleware.
- `spanFlow()` adds `.flow(name, ctx?)` (`child("flow", name, …pairs)`) and `.span(label, fn?)` (start/done + `elapsedMs`, or error / `never-happen` + rethrow). Default `halua` is built with `spanFlow()`.
- `capture()` is opt-in: shared `collect()` / `clear()` buffer of raw dispatch records for asserting the log story.
- Docs: LDD section in `agents-for-module.md`, contributor note in `AGENTS.md`, README + tour. Research note remains repo-only.
- Additive / minor. No JSON shape or `DispatcherExecuteMeta` change.
