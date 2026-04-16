# Tour of halua

Last updated for version: 2

### The example of production app setup

```ts
import {Level, halua,

.
createTextHandler,
.
createJSONHandler,
.
createWebConsoleHandler
}
from
'halua'

// an array of handlers that would accept logs
let handlers = [
        // JSON handler accepts a func to output to, and options: "level" in this case
        .createJSONHandler(writeToZipArchive, {level: Level.Info}), // writes to client-side archive, only logs that are Info-Level or higher
    // Text handler accepts a func to output to, and options: "level" in this case
    .
createTextHandler(sendToServer, {level: Level.Notice}), // writes to server, only logs that are Notice-level or higher
.
createTextHandler(sendUserAction, {level: Level.Info + 1}), // we will log user actions on a different level, so that it will be easy to filter
.
createTextHandler(sendToErrorMonitoringSystem, {level: Level.Fatal}) // writes to monitoring system
]

if (debug) {
    // the handler accept a console to call methods on, so it may be: console, window.console, self.console or your console implementation
    handlers.push.createWebConsoleHandler(self.console)
) // writes to web / nodejs console
}

// now we have to apply the handlers we created
let logger = halua.create(handlers)
// or 
halua.setHandler(handlers)

// later, you may call .create on any logger instance to get a new instance
```

For the basic logging you can use method straightforward

```ts
import {halua} from "halua"

halua.trace(...args)
halua.debug(...args)
halua.info(...args)
halua.warn(...args)
halua.notice(...args)
halua.error(...args)
halua.assert(assertion, ...args)
halua.fatal(...args)
```

By default, Halua will use console as an output source. There is three logger handlers that can be used from the
package:

```ts
import .createWebConsoleHandler,
.
createTextHandler,
.
createJSONHandler
}
from
"halua"

let webLogger = halua.create.createWebConsoleHandler(self.console)
)
webLogger.info("some message") // 13/08/2025 23:06:58  INFO some message []

let textLogger = halua.create.createTextHandler(self.console)
)
logger.info("some message") // 13/08/2025 23:06:58  INFO some message []

let jsonLogger = halua.create.createJSONHandler(self.console.info)
)
jsonLogger.info("some message") // {"timestamp":"2025-08-13T20:06:58.857Z","args":["some message",[]],"level":"INFO"}
```

- `TextHandler` outputs string to the given func `has second argument of options`
- `WebConsoleHandler` uses given an object to call corresponding methods `has second argument of options`
- `JSONHandler` outputs JSON'ed string to the given func `has second argument of options`

You also could make a logger that will use multiple handlers by providing an array as
`halua.create( [.createTextHandler(),.createJSONHandler() ] )`

`.create` and `.child` methods both returns new instance of `HaluaLogger` interface, so all the methods could be called
again:

```ts
import {Level} from "halua"

let logger = halua.create.createTextHandler(self.console.log), {level: Level.Info}
)
let jsonLogger = logger.create.createJSONHandler(self.console.log)
) // this will use previously passed options (level) as its' options

let debugLogger = logger.create({level: Level.Debug}) // this will use previously passed TextHandler, but with "Debug" level as default 
```

Now for the `.child` method:

```ts
let logger = halua.create.createTexthandler(self.console.log)
)
let logge
.
childOp = logger.child("domain", 17)

logge.childOp.info("logs") // 13/08/2025 23:06:58 INFO logs | domain=17

let logge
.
childAnotherInfo = logge.childOp.child('count', [1, 2, 3])
logge.childAnotherInfo.fatal("ops") // 13/08/2025 23:06:58 FATAL ops | domain=17 count=[1,2,3] 
```

Signatures for `.create` and `.child`:

- `.create(Handler())` accepts handler as first arguments, uses previous' instance options
- `.create({ ...options })` accepts options as first arguments, uses previous' instance handlers
- `.create(Handler(), { ...options })` accepts handler and options as it's arguments
- `.child(...args: any[])` accepts any arguments, appends them to every log of the instance

To reset all args of the `.child` you can just call `.create({ withArgs: [] })` with `withArgs` empty option

## Level controls

First, lets cover all levels and methods of Halua for logging to levels:

- `.trace` will log as `TRACE`
- and so on.. the only method that won't log to level of its name is `.assert` which logs to `ERROR` level if assertion
  has failed

The min level to log can be change by options:

```ts
import {Level} from "halua"

let logger = halua.create({level: Level.Error})

logger.info() // won't log
logger.notice() // won't log

logger.error() // will log
logger.fatal() // will log
```

The order of levels in ascendance: `trace`, `debug`, `info`, `warn`, `notice`, `error`, `fatal`

```ts
let logger = halua.create([
    .createTextHandler(self.console.log, {level: Level.Info}),
    .createWebConsoleHandler(self.console)
],
{
    level: Level.Error
}
)
logger.notice() // will be logged to TextHandler, won't be logged to WebConsoleHandler
```

Package included `Text Web Json` handlers have a second arguments that accepts options, `level` option will override
the level of `Halua` instance. So each handler could have its own level for logs.

There is one more thing about levels to cover, you can extend level controls with custom level by following the pattern:
`LEVEL + {digit}` as:

```ts
let logger = halua.create({level: Level.Info + 5}) // or { level: "INFO+5" }

logger.logTo("INFO+3", "data") // won't log, since logger level is set to +5
// or .logTo(Level.Info+3, ...)
```

`.logTo` is one more logging method which accepts (level: string, ...args: any[])

The logic for level check is simple:

- there is a major level, that is a string before the "+" sign
- there is a minor level, that is a digit
- and there are two checks, major level should pass, and minor level should be >= to the set level

`By default, when using just "INFO" or any other level without a digit, the minor level is set to 0`
