import { Bench } from "tinybench"
import { halua, NewJSONHandler, NewTextHandler, NewWebConsoleHandler } from "../lib/index.js"

const bench = new Bench({ name: "base benchmark", time: 100 })

let textLogger = halua.New(NewTextHandler(console.info))
let jsonLogger = halua.New(NewJSONHandler(console.info))
let consoleLogger = halua.New(NewWebConsoleHandler(console))

bench
    .add("text handler", () => {
        textLogger.info("hello!")
    })
    .add("json handler", () => {
        jsonLogger.info("hello!")
    })
    .add("console handler", () => {
        consoleLogger.info("hello!")
    })
    .add("text handler obj", () => {
        textLogger.info("hello", { from: "world" })
    })
    .add("json handler obj", () => {
        jsonLogger.info("hello", { from: "world" })
    })
    .add("console handler obj", () => {
        consoleLogger.info("hello", { from: "world" })
    })

await bench.run()

console.log(bench.name)
console.table(bench.table())
// ┌─────────┬───────────────────────┬──────────────────┬───────────────────┬────────────────────────┬────────────────────────┬─────────┐
// │ (index) │ Task name             │ Latency avg (ns) │ Latency med (ns)  │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
// ├─────────┼───────────────────────┼──────────────────┼───────────────────┼────────────────────────┼────────────────────────┼─────────┤
// │ 0       │ 'text handler'        │ '6767.3 ± 4.23%' │ '5916.0 ± 208.00' │ '162874 ± 0.19%'       │ '169033 ± 6129'        │ 14815   │
// │ 1       │ 'json handler'        │ '10727 ± 5.89%'  │ '7958.0 ± 291.00' │ '115976 ± 0.42%'       │ '125660 ± 4448'        │ 9322    │
// │ 2       │ 'console logger'      │ '9682.8 ± 4.34%' │ '8625.0 ± 250.00' │ '112848 ± 0.20%'       │ '115942 ± 3461'        │ 10328   │
// │ 3       │ 'text handler obj'    │ '10664 ± 43.12%' │ '6792.0 ± 250.00' │ '141224 ± 0.26%'       │ '147232 ± 5227'        │ 9378    │
// │ 4       │ 'json handler obj'    │ '15926 ± 7.97%'  │ '8459.0 ± 333.00' │ '103705 ± 0.75%'       │ '118217 ± 4478'        │ 6279    │
// │ 5       │ 'console handler obj' │ '19827 ± 8.62%'  │ '11333 ± 292.00'  │ '78743 ± 0.77%'        │ '88238 ± 2334'         │ 5049    │
// └─────────┴───────────────────────┴──────────────────┴───────────────────┴────────────────────────┴────────────────────────┴─────────┘
