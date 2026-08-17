# Log-driven development and Halua

Status: research only. Not a committed API. Not shipped in the npm package.

This note answers two questions:

1. What can Halua add, refine, or rework so log-driven development (LDD) is a natural way to use the library?
2. How should `agents-for-module.md` (shipped as `lib/AGENTS.md`) and the repo `AGENTS.md` change so AI agents actually follow LDD, instead of treating logging as optional decoration?

## Why this exists

Halua already has the primitive the LDD idea needs. `.child(...args)` copies `args` onto every later line via `options.withArgs` (`src/main/halua.ts`: `sendToBalancer` does `args.concat(this.options.withArgs ?? [])`). A token that is present on every child line is a **flow mark**: something a human, a grep, a dispatcher, or an agent can follow as one story.

That is closer to Pino child bindings / slog groups than to Log4j/SLF4J `Marker` (a named filter token independent of fields). Both ideas are useful. Halua already has the first. The second should not become a new type unless we need “filter this event without attaching context”.

Halua also ships consumer instructions into the published package (`agents-for-module.md` → `lib/AGENTS.md`). Those files currently say “use child loggers for context” and “never `console.*`”. They do not say _design the log story first_, _give every unit of work a stable mark_, or _verify by reading that mark’s stream_. Empirical work on agentic PRs (see Sources) shows that vague “add logs / ensure observability” text is rare and usually ignored. Instructions that work are short, example-first, and checkable.

## What people mean by LDD

The phrase is not one school. Useful overlap first; satire last.

| Lineage                                                    | Claim                                                                                                                                                                                                                                                  | Take for Halua                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Logz.io / InfoWorld (2016)                                 | LDD is TDD’s production counterpart. Design logs, metrics, alerts, and “this should never happen” lines in the design phase. The feature owner is accountable for that stream.                                                                         | Design the story first. Log never-happen branches as first-class events, not comments.                         |
| Observability-driven development                           | Before writing code, ask “how will I know it works?” Design the runtime narrative (spans or logs), then implement until that narrative is true. Honeycomb later warns: observability _helps_ development; it should not replace the customer problem.  | The LDD question is “how will I know it works?”. Logs are the answer that still works in production.           |
| “Observability is Engineering” (2025–26)                   | Design log _output_ before business logic. Tests define expected behavior; logs define the expected runtime narrative.                                                                                                                                 | Closest to an agent-usable loop: write the story, implement, confirm the story.                                |
| logrock / session-history LDD (2021)                       | A session id plus an action history lets QA and prod reconstruct what the user did.                                                                                                                                                                    | Child mark = session / request / flow id.                                                                      |
| AI-era logging (Shipbook 2026; arXiv:2604.09409, Apr 2026) | Logs are the agent’s feedback channel from reality. Agents change logging less often than humans, underuse INFO/context, ignore natural-language logging instructions about two-thirds of the time, and leave humans to silently repair observability. | Agent files must be operational, example-heavy, and checkable. Philosophy paragraphs will not move the needle. |
| log-driven-development.github.io                           | Satire: `console.log("INSIDE IF")`, delete tests, WET.                                                                                                                                                                                                 | Anti-pattern. LDD does not replace tests.                                                                      |

**Halua LDD**, for this note:

> Design the grepable runtime story of a unit of work before (or as the first step of) writing its logic. Encode that story as a child **flow mark** plus a small, stable event vocabulary. Implement until that mark’s log stream answers “how will I know it works?”. Tests stay. Logs are the production-shaped feedback loop — including for AI agents.

Honeycomb’s caution still applies: the point is the feature, not the logger. LDD is how you _know_ the feature happened.

## What Halua already gives LDD

| Existing                                      | LDD job                                       | Gap                                                                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.child(...args)` + `withArgs`                | Persistent flow mark and correlation          | Args are positional suffixes. `"requestId", id` pairs are convention, not structure. JSON dumps them into `args` mixed with the message.                                                                                                           |
| Nested `.child("step", "validate")`           | Sub-story                                     | No enter/exit except by logging it yourself. Dispatch meta has no parent pointer.                                                                                                                                                                  |
| `.stamp` / `.stampEnd` / ender `() => number` | Timed chapter                                 | The stamp `Map` is per instance; a child does not share the parent’s stamps. The log line is free text (`label took X.XXms`); there is no structured `elapsedMs` field. The ender returning raw ms (this branch) is already useful for assertions. |
| Levels, `LEVEL+N`, dispatcher `exact`         | Signal vs noise; dedicated channels (`AUDIT`) | No reserved never-happen / decision level. Agents underuse INFO/context.                                                                                                                                                                           |
| `.error(err, meta?)` + typed `ErrorMeta`      | Failure chapter with tracker payload          | `errorMeta` is separate from child marks. Correlation must be copied by hand if the tracker needs it.                                                                                                                                              |
| `redactDataRegExp` / `DefaultRedactRegExp`    | Safe LDD in prod                              | Agents still leak secrets unless the instruction is operational.                                                                                                                                                                                   |
| Zero-cost disabled levels                     | Keep DEBUG chapters in the source             | Agents often delete debug instead of leaving it on a child at DEBUG.                                                                                                                                                                               |
| Pluggable dispatchers                         | Same story → console / file / JSON            | No capture helper for “assert on the log story” in tests.                                                                                                                                                                                          |

Implementation facts that constrain any LDD design:

- Child context is **appended after** call-site args (`sendToBalancer`). Grep still works. Visual scanning of text logs puts the mark at the end of the line.
- `DispatcherExecuteMeta` is `{ level, timestamp, redactDataRegExp? }`. A dispatcher cannot tell context from message without heuristics.
- JSON shape is `{ timestamp, level, args }`. No `ctx`, no `mark`, no `elapsedMs`.
- `.create({ withArgs: [] })` is the only way to drop inherited marks.
- `child()` constructs a new `Halua` with a fresh `stamps` Map. Use the ender closure to finish a stamp; do not expect `parent.stampEnd(id)` to see a stamp started on a child (or the reverse).

## Recommended convention (no API change)

Treat the first child pair as the flow mark. Use the key `flow`. Values are stable `kebab-case` names that survive across PRs (`checkout`, `halua-dispatch`), not `tmp` / `test` / `foo`.

Event vocabulary — first string argument, do not invent synonyms:

| Event          | When                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `start`        | Unit of work began; include the ids you will need later.                                        |
| `skip`         | Deliberate early exit.                                                                          |
| `retry`        | Same work attempted again.                                                                      |
| `done`         | Success path finished.                                                                          |
| `never-happen` | Branch you believe is impossible, or a non-`Error` failure. Always a real log, never a comment. |

Then a structured object. `.stamp("<verb noun>")` around I/O or anything that can be slow. `.error(err, meta)` only for `Error` instances.

```ts
let log = halua.child("flow", "checkout", "requestId", reqId)
log.info("start", { orderId })
let end = log.stamp("charge")
try {
    let result = await charge(order)
    end()
    if (!result.ok) {
        log.warn("skip", { reason: result.reason })
        return
    }
    log.info("done", { paymentId: result.id })
} catch (err) {
    end()
    if (err instanceof Error) {
        log.error(err, { orderId })
    } else {
        log.warn("never-happen", { err })
    }
}
```

Grep: `flow checkout`. That stream _is_ the LDD artifact.

Rules that keep the story usable:

- One child per unit of work (request, job, tool call, feature path). Do not log that work on the root logger.
- Nest for steps: `log.child("step", "validate")`. Keep the parent `flow` mark.
- Do not delete LDD lines after the feature works. Drop them to DEBUG, or leave them. They are the production-shaped test.
- Never-happen is `warn` or `error`, not `debug`. If it fires, someone must see it.
- Verify by reading the mark: run the path, collect lines that contain `flow <name>`, confirm `start` → decisions → `done` (or the expected failure). Passing unit tests without that check is not LDD.

Anti-pattern (what agents emit by default):

```ts
console.log("charging")
halua.info("ok")
```

No mark, no story, nothing to grep, nothing an agent can use as a feedback loop on the next turn.

## What to add / refine / rework

Three approaches. Do **A** now (this convention + later agent-file edits). Sequence **B** as small PRs if we want marks to be machine-first. Reject **C** unless traces become a product.

### A — Convention + agent instructions (do first)

Zero surface. Matches “keep the core small”. Immediately teachable. Mark quality is social: people will invent inconsistent keys until the agent file and README show one pattern.

### B — Small library refinements (follow-up PRs)

Stay inside the balancer / dispatcher model. No middleware layer.

1. **Split context from message in dispatch meta.** Put `withArgs` (or a derived `ctx`) on `DispatcherExecuteMeta`. JSON grows a `ctx` (or `with`) field. Text keeps the current suffix, or optionally prefixes the mark. **Compat:** adding a JSON field is a minor if existing keys stay. Removing context from `args` is a major. Duplicate first (`args` still contains `withArgs`; `ctx` repeats them). Deprecate the mix later.

2. **Object-form `.child`.** `child({ requestId, userId })` makes pairs structural. Keep `child(...args)`.

3. **Reserved mark key, optional sugar.** Convention: first pair is `flow`. Optional `child` sugar that is still `child("flow", name)` underneath. Do **not** add a parallel Marker type unless we need filter-without-fields. Halua already has dispatcher `exact` and custom majors for channel-style filtering.

4. **Capture helper for tests.** Something like `NewCaptureDispatcher()` / `collect()` that returns lines or records. Then LDD is assertable: this mark emitted `start` → `done`, no `never-happen`. This is the deterministic guardrail the agent-logging study asks for. Natural language in `AGENTS.md` will not substitute for it.

5. **Structured stamp.** Keep the pretty `took X.XXms` line. Also attach `{ elapsedMs }` (the ender already returns the number). Optional DEBUG line at stamp start so the story has open + close.

6. **Document stamp locality.** Do not inherit the parent `stamps` Map onto children unless someone has a real `stampEnd` across the boundary. The ender closure is the correct API.

Suggested order if we implement B: (6) as docs, then (4), then (1) with duplication, then (2), then (5), then (3) only if (2) is not enough.

### C — Reject for now

`.span()`, OpenTelemetry export, log middleware, automatic enter/exit, a central shipper. That fights the architecture note in repo `AGENTS.md` and Halua’s size thesis. Child + stamp already cover most of the story.

## How to change agent instructions

Constraint from arXiv:2604.09409: among 4,550 agentic PRs, explicit logging instructions appeared in 4.7% of cases and agents failed constructive logging requests about 67% of the time. Stronger wording did not fix compliance. Humans then repaired logging in later commits (72.5% of post-generation log edits on agent PRs).

So: do not add a philosophy section. Add a **short, mandatory, example-first, checkable** section. Only document APIs that already ship.

### Draft for `agents-for-module.md` (consumer / AI)

Place immediately after **Logging Policy**. Suggested text:

---

#### Log-driven development (mandatory for new work)

Before implementing a feature, request, job, or tool call, write the log story: a flow mark, a `start`, the decision branches, a `done`, and one `never-happen` / failure. Then implement until that story is what the process emits.

- Create one child per unit of work: `let log = halua.child("flow", "<stable-name>", ...)`. Do not log that work on the root logger.
- First argument is one of: `start` | `skip` | `retry` | `done` | `never-happen`. Next argument is a structured object.
- `flow` values are stable `kebab-case` (`checkout`, not `tmp`).
- `.stamp("<verb noun>")` around I/O and anything that can be slow.
- `.error(err, meta)` only for `Error`. Non-errors use `warn("never-happen", …)` or another level.
- Do not delete these lines when the feature works. Drop to DEBUG or leave them.
- Verify: run the path, collect lines containing `flow <name>`, confirm `start` → … → `done` (or the expected failure). Do not claim the feature works from tests alone if the mark’s stream is missing or incoherent.

```ts
let log = halua.child("flow", "checkout", "requestId", reqId)
log.info("start", { orderId })
let end = log.stamp("charge")
try {
    let result = await charge(order)
    end()
    if (!result.ok) {
        log.warn("skip", { reason: result.reason })
        return
    }
    log.info("done", { paymentId: result.id })
} catch (err) {
    end()
    if (err instanceof Error) {
        log.error(err, { orderId })
    } else {
        log.warn("never-happen", { err })
    }
}
```

Wrong:

```ts
console.log("charging")
halua.info("ok")
```

---

Also tighten the existing child section to point at `flow` as the mark key, and keep the current “never `console.*`” / “`.error` only for `Error`” rules.

Do **not** put in the shipped file: DevOps/ELK essays, “log everything”, APIs that do not exist (`logger.flow`, a `ctx` JSON field), OpenTelemetry.

### Draft for repo `AGENTS.md` (contributors)

Shorter. Do not duplicate the literature review.

- Features and tools in this repo follow the same LDD convention, through the local `halua` instance (already required).
- New public logging behavior (format, child, stamp, JSON shape) needs a unit test that asserts the _story_ (mark present, event order), not only that a line was emitted.
- Rationale: `docs/research/log-driven-development.md`.

### README and tour (later, if LDD becomes a product story)

- README: a short “Child loggers as flow marks” subsection under Child Loggers, with the `start` / `done` example. README stays the user source of truth.
- `docs/tour-of-halua.md`: expand “Request tracing → `.child` everywhere” into a one-page LDD walkthrough.
- Update both in the same PR as `agents-for-module.md` if we adopt the convention publicly.
- This research file stays out of the published package.

### What actually makes agents comply

A capture helper (B.4) plus a test like:

```ts
expect(lines.join("\n")).toMatch(/flow checkout[\s\S]*start[\s\S]*done/)
```

That is a guardrail. A paragraph in `AGENTS.md` is not. Until B.4 exists, consuming apps can do the same with `NewTextDispatcher` / `NewJSONDispatcher` pushing into an array — Halua’s own `src/index-unit.ts` already does this.

## How an agent should practice LDD on a Halua-using repo

1. Name the unit of work. Pick `flow <kebab-name>`.
2. Write the story as comments or as the first log calls: `start`, branches, `done`, `never-happen`.
3. Implement behind `let log = halua.child("flow", name, ...)`.
4. Stamp I/O. Do not `console.*`.
5. Run the path. Read lines that contain the mark.
6. If the story is missing a chapter or the mark is absent, fix the logs before calling the work done.
7. Leave the logs in the tree.

## Build and publish exclusion

`docs/research/` is repo-only:

- Vite library entry is `src/index.ts` (`vite.config.ts`). The only extra copy is `agents-for-module.md` → `lib/AGENTS.md`.
- `tsconfig.json` `include` is `src/**/*.ts`.
- `package.json` `"files"` is `lib`, `README.md`, `LICENSE`.

Do not add this directory to `"files"` or to the Vite entry. No extra exclude list is required.

## Sources

- Tomer Levy, [An Introduction to Log-Driven Development](https://logz.io/blog/log-driven-development/) (Logz.io, 2016) and [Get started with log-driven development](https://www.infoworld.com/article/2243231/get-started-with-log-driven-development.html) (InfoWorld, 2016).
- Charity Majors, [What Observability-Driven Development Is Not](https://www.honeycomb.io/blog/observability-driven-development) (Honeycomb).
- Colin Fallwell, [How observability-driven development creates elite performers](https://stackoverflow.blog/2022/10/12/how-observability-driven-development-creates-elite-performers/) (Stack Overflow / Sumo Logic, 2022).
- [Log Driven Development](https://medium.com/observability-is-engineering/log-driven-development-e4846484bc14) and [Why Logs Should Be a First-Class Citizen in Your Code](https://medium.com/observability-is-engineering/log-driven-development-why-logs-should-be-a-first-class-citizen-in-your-code-203996e4b291) (Observability is Engineering, 2025–26).
- Alex Sergey, [Log-Driven Development](https://dev.to/alexsergey/log-driven-development-3jmf) (DEV, 2021) / [logrock](https://github.com/AlexSergey/logrock).
- [Logs in the Age of AI Agents](https://www.shipbook.io/blog/logs-for-ai-agents) (Shipbook, 2026).
- Ouatiti, Sayagh, Li, Hassan, [Do AI Coding Agents Log Like Humans? An Empirical Study](https://arxiv.org/html/2604.09409v1) (arXiv:2604.09409, Apr 2026).
- [log-driven-development.github.io](http://log-driven-development.github.io/) (satire; cited as anti-pattern).
- SLF4J/Log4j Markers vs Pino/slog child bindings — context fields are what Halua `.child` already is; named Markers are a different, optional filter concept.
