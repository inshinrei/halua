Next release: major

### JSON handler correctness and structured output (fixes 1.1)
- `NewJSONHandler` now always emits *valid* JSON via `JSON.stringify` on a normalized value tree (no more manual escaping, no unescaped quotes/newlines, no `=>` in maps).
- New `toJSONValue` (used by JSON path) converts every `ArgumentType` to a legal JSON value: Errors become `{name,message,stack: string[]}`, Maps/Sets/arrays are real structures (not pre-formatted text), dates ISO, circulars marked, etc.
- This changes the shape of `args[]` items for complex types compared to the previous (broken) output — consumers of structured logs must adapt (hence major).

### Docs refresh (post-3.0.0)

- Complete rewrite of README.md as the primary user documentation with verified examples
- Rewrote `docs/tour_of_halua.md` for v3 accuracy (fixed all broken code samples from v2 era)
- Added `AGENTS.md` at repository root with strict contributor rules (let/const style, mandatory halua logging policy,
  yorozu preference, expert mode)
- `AGENTS.md` is deliberately included in the published package (`"files"`) so it lands in
  `node_modules/halua/AGENTS.md` for downstream consumers and AI agents
- All documented examples were executed against the real built `lib/` output to guarantee correctness