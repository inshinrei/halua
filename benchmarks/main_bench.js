import { Bench } from "tinybench"
import { halua, NewConsoleDispatcher, NewJSONDispatcher, NewTextDispatcher } from "../lib/index.js"

const bench = new Bench({ name: "halua v3 benchmark (dispatch + DispatcherBase)", time: 100 })

// Use no-op sinks so we measure pure logging + formatting path (not console I/O noise)
const noopSend = () => {}
const noopConsole = { debug: noopSend, info: noopSend, warn: noopSend, error: noopSend }

let textLogger = halua.create(NewTextDispatcher(noopSend))
let jsonLogger = halua.create(NewJSONDispatcher(noopSend))
let consoleLogger = halua.create(NewConsoleDispatcher(noopConsole))

bench
    .add("text dispatcher", () => {
        textLogger.info("hello!")
    })
    .add("json dispatcher", () => {
        jsonLogger.info("hello!")
    })
    .add("console dispatcher", () => {
        consoleLogger.info("hello!")
    })
    .add("text dispatcher obj", () => {
        textLogger.info("hello", { from: "world" })
    })
    .add("json dispatcher obj", () => {
        jsonLogger.info("hello", { from: "world" })
    })
    .add("console dispatcher obj", () => {
        consoleLogger.info("hello", { from: "world" })
    })

await bench.run()

console.log(bench.name)
console.table(bench.table())
// (Historical v2-era benchmark output removed for brevity; see git history.)
// v3: generator protocol gone, dispatch + DispatcherBase path is the current reality.
// │ (index) │ Task name             │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
// ├─────────┼───────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
// │ 0       │ 'text dispatcher'        │ '6767.3 ± 4.23%' │ '5916.0 ± 208.00' │ '162874 ± 0.19%'       │ '169033 ± 6129'        │ 14815   │
// │ 1       │ 'json dispatcher'        │ '10727 ± 5.89%'  │ '7958.0 ± 291.00' │ '115976 ± 0.42%'       │ '125660 ± 4448'        │ 9322    │
// │ 2       │ 'console logger'      │ '9682.8 ± 4.34%' │ '8625.0 ± 250.00' │ '112848 ± 0.20%'       │ '115942 ± 3461'        │ 10328   │
// │ 3       │ 'text dispatcher obj'    │ '10664 ± 43.12%' │ '6792.0 ± 250.00' │ '141224 ± 0.26%'       │ '147232 ± 5227'        │ 9378    │
// │ 4       │ 'json dispatcher obj'    │ '15926 ± 7.97%'  │ '8459.0 ± 333.00' │ '103705 ± 0.75%'       │ '118217 ± 4478'        │ 6279    │
// │ 5       │ 'console dispatcher obj' │ '19827 ± 8.62%'  │ '11333 ± 292.00'  │ '78743 ± 0.77%'        │ '88238 ± 2334'         │ 5049    │
// └─────────┴───────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘

// base benchmark with generators (10 runs avg)
// ┌─────────┬───────────────────────┬───────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
// │ (index) │ Task name             │ Latency avg (ns)  │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
// ├─────────┼───────────────────────┼───────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
// │ 0       │ 'text dispatcher'        │ '6904.3 ± 3.88%'  │ '6209.0 ± 208.00' │ '158731 ± 0.15%'       │ '161057 ± 5220'        │ 14484   │
// │ 1       │ 'json dispatcher'        │ '5940.5 ± 5.28%'  │ '5125.0 ± 167.00' │ '190573 ± 0.15%'       │ '195122 ± 6572'        │ 16834   │
// │ 2       │ 'console dispatcher'     │ '8578.1 ± 24.26%' │ '6459.0 ± 207.00' │ '151382 ± 0.18%'       │ '154823 ± 4808'        │ 12925   │
// │ 3       │ 'text dispatcher obj'    │ '7787.6 ± 6.32%'  │ '6625.0 ± 166.00' │ '148286 ± 0.16%'       │ '150943 ± 3711'        │ 12841   │
// │ 4       │ 'json dispatcher obj'    │ '6951.0 ± 7.22%'  │ '5625.0 ± 208.00' │ '172594 ± 0.19%'       │ '177778 ± 6826'        │ 14387   │
// │ 5       │ 'console dispatcher obj' │ '10786 ± 20.71%'  │ '8042.0 ± 208.00' │ '122449 ± 0.20%'       │ '124347 ± 3135'        │ 9272    │
// └─────────┴───────────────────────┴───────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
