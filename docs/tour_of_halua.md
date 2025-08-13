# Tour of halua

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

By default Halua will use console as output source. There is three logger handlers that can be used from the package:

```ts
import {NewWebConsoleHandler, NewTextHandler, NewJSONHandler} from "halua"

let webLogger = halua.New(NewWebConsoleHandler(self.console))
webLogger.info("some message") // 13/08/2025 23:06:58 INFO some message []

let textLogger = halua.New(NewTextHandler(self.console))
logger.info("some message") // 13/08/2025 23:06:58 INFO some message []

let jsonLogger = halua.New(NewJSONHandler(self.console.info))
jsonLogger.info("some message") // {"timestamp":"2025-08-13T20:06:58.857Z","args":["some message",[]],"level":"INFO"}
```

- `TextHandler` outputs string to the given func `has second argument of options`
- `WebConsoleHandler` uses given object to to call corresponding methods `has second argument of options`
- `JSONHandler` outputs JSON'ed string to the given func `has second argument of options`

You also could make a logger that will use multiple handlers by providing an array as
`halua.New( [ NewTextHandler(), NewJSONHandler() ] )`

`.New` and `.With` methods both returns new instance of `HaluaLogger` interface, so all the methods could be called
again:

```ts
import {Level} from "halua"

let logger = halua.New(NewTextHandler(self.console.log), {level: Level.Info})
let jsonLogger = logger.New(NewJSONHandler(self.console.log)) // this will use previously passed options (level) as its' options

let debugLogger = logger.New({level: Level.Debug}) // this will use previously passed TextHandler, but with "Debug" level as default 
```

Now for the `.With` method:

```ts
let logger = halua.New(NewTexthandler(self.console.log))
let loggerWithOp = logger.With("domain", 17)

loggerWithOp.info("logs") // 13/08/2025 23:06:58 INFO logs | domain=17

let loggerWithAnotherInfo = loggerWithOp.With('count', [1, 2, 3])
loggerWithAnotherInfo.fatal("ops") // 13/08/2025 23:06:58 FATAL ops | domain=17 count=[1,2,3] 
```

Signatures for `.New` and `.With`:

- `.New(Handler())` accepts handler as first arguments, uses previous' instance options
- `.New({ ...options })` accepts options as first arguments, uses previous' instance handlers
- `.New(Handler(), { ...options })` accepts handler and options as it's arguments
- `.With(...args: any[])` accepts any arguments, appends them to every logs of the instance

To reset all args of the `.With` you can just call `.New({ withArgs: [] })` with `withArgs` empty option

## Custom handlers

```ts
import type {Handler, Log} from "halua"

class CustomHandler implements Handler {
  public log(log: Log) {
  }

...
}

let logger = halua.New(() => new CustomHandler()) // passed handler should be a func that returns an interface of Handler{}
```

## Level controls

First, lets cover all levels and methods of Halua for logging to levels:

- `.trace` will log as `TRACE`
- and so on.. the only method that won't log to level of its name is `.assert` which logs to `ERROR` level if assertion
  has failed

The min level to log can be change by options:

```ts
import {Level} from "halua"

let logger = halua.New({level: Level.Error})

logger.info() // won't log
logger.notice() // won't log

logger.error() // will log
logger.fatal() // will log
```

The order of levels in ascendance: `trace`, `debug`, `info`, `warn`, `notice`, `error`, `fatal`

```ts
let logger = halua.New([
  NewTextHandler(self.console.log, {level: Level.Info}),
  NewWebConsoleHandler(self.console)
], {level: Level.Error})
logger.notice() // will be logged to TextHandler, won't be logged to WebConsoleHandler
```

Package included `Text Web Json` handlers have a second arguments that accepts options, `level` option will override
the level of `Halua` instance. So each handler could have it's own level for logs.

There is one more thing about levels to cover, you can extend level controls with custom level by following the pattern:
`LEVEL + {digit}` as:

```ts
let logger = halua.New({level: Level.Info + 5}) // or { level: "INFO+5" }

logger.logTo("INFO+3", "data") // won't log, since logger level is set to +5
// or .logTo(Level.Info+3, ...)
```

`.logTo` is one more logging method which accepts (level: string, ...args: any[])

The logic for level check is simple:

- there is a major level, that is a string before the "+" sign
- there is a minor level, that is a digit
- and there are two checks, major level should pass, and minor level should be >= to the set level

`By default, when using just "INFO" or any other level without a digit, the minor level is set to 0`

## Changing message format for Text and WebConsole handlers

`TextHandler` and `WebConsoleHandler` both have an option called `messageFormat` that can change what they'll output

```ts
let logger = halua.New(NewTextHandler(self.console.log, {messageFormat: "%l %a > %w"}))
logger.With("count", 2).info("message") // INFO message > count=2
```

In message format's string substitution, there is:

- `%t` - timestamp
- `%l` - level
- `%a` - arguments
- `%w` - arguments appended by `.With` method

You may change the format as you like, for example:

```ts
logger.With('with').withMessageFormat("[%t] - %l> %a | %w").info("message!")
// [13/08/2025 23:06:58] - INFO> message! | with  
```

`withMessageFormat` will pass its format to all handlers of current logger instance. Returns current instance of the
logger 