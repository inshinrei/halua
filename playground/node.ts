import { halua, Level } from "../src"

let logger = halua.create(console, { pretty: true, minLevel: Level.Info })
logger.debug("debug message", "count", 5)
logger.info("info message")
logger.warn("warning")
logger.err("error message")

let logger2 = halua.child("some operation")
logger2.debug("second debug message", "count", 2, "other count", true, [1, 2, 3], { prop: "aboba " })

logger = logger.create()
logger.info("third info message")
