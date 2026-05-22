import { halua, NewTextHandler, NewJSONHandler, NewConsoleHandler, Level } from "../src"

console.log("=== Halua v3 Playground ===\n")

// Default logger (preconfigured with NewConsoleHandler)
halua.info("Application started with default console handler")
halua.warn("Disk space low", { available: "12%" })

// Per AGENTS.md policy: use .error only with Error instance as first (and usually only) arg
halua.error(new Error("timeout"))

// Dedicated Text logger (human readable, captures via send fn)
let textLines: string[] = []
let textLogger = halua.create(
    NewTextHandler((line) => {
        textLines.push(line)
        console.log("[TEXT]", line)
    }),
)
textLogger.info("user action", { id: 123, type: "click" })

// JSON logger for structured
let jsonLogger = halua.create(
    NewJSONHandler((json) => {
        console.log("[JSON]", json)
    }),
)
jsonLogger.info("structured", { success: true })

// Child loggers with context inheritance
let reqLogger = halua.child("requestId", "abc-123", "user", 42)
reqLogger.info("processing started")

let stepLogger = reqLogger.child("step", "validate")
stepLogger.warn("slow validation")

// Level filtering + per-handler options
let levelLogger = halua.create(NewConsoleHandler(console), { level: Level.Warn })
levelLogger.debug("hidden (below level)")
levelLogger.warn("visible at WARN")

// Minor / custom levels (INFO+ N)
let minorLogger = halua.create(
    NewTextHandler((l) => console.log("[MINOR]", l)),
    {
        level: `${Level.Info}+2`,
    },
)
minorLogger.logTo("INFO+1", "filtered (minor too low)")
minorLogger.logTo("INFO+2", "borderline")
minorLogger.logTo("INFO+3", "important")

// assert only logs on failure at ERROR
halua.assert(2 + 2 === 5, "math still works?") // will log

// Multi-handler example
let multi = halua.create([
    NewTextHandler((l) => console.log("[MULTI-TEXT]", l)),
    NewJSONHandler((j) => console.log("[MULTI-JSON]", j)),
])
multi.notice("both handlers fired")

console.log("\n=== Playground complete (textLines captured:", textLines.length, ") ===")
