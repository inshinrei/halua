Next release: minor

### Zero-cost disabled log levels via NOOP method swapping (performance)

- `Halua` level methods (`trace`, `debug`, `info`, `warn`, `notice`, `error`, `fatal`, `assert`) are now conditionally bound at construction and after `setDispatchers`/`appendDispatchers`:
    - If `balancer.hasHandlers(level)` is true → bound to the real implementation (`_info` etc.)
    - If false → bound to a module-level `const NOOP = () => {}`
- `logTo` is deliberately never replaced (it is the dynamic-level escape hatch and must always work).
- Previously every call, even to a completely disabled level, went through `sendToBalancer` → `discover` → early return with an empty handler list. Now such calls are true no-ops (zero frame, zero allocations, no balancer touch).
- The optimization is transparent: public behavior, child loggers, `.create()`, `stamp`, error handling, and all dispatcher contracts are 100% unchanged.
- New tests in `index-unit.ts` assert the NOOP identity for disabled levels and real functions for enabled ones (including after dynamic dispatcher changes).
- Delivers the classic "disabled debug logs cost nothing" guarantee that performance-sensitive code relies on when sprinkling `logger.debug(...)` liberally.
- Purely additive internal improvement (minor). No public API, type, or behavioral changes for consumers.
