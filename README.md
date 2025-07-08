# halua

Is a logger for TS/JS projects. Log handler is separated from logger abstraction, supported handlers:

- JSONHandler
- WebBrowserConsoleHandler (also for node, but I guess "ConsoleHandler" will come separately in future, since coloring
  for "pretty" option is different in Node)
- TextHandler - compose all arguments into single string

### installation

```text
pnpm i halua
```

```text
npm i halua
```

```text
yarn add halua
```

### calling signature

```ts
import {halua} from 'halua'

halua.debug()
halua.info()
halua.warn()
halua.error()
halua.assert()

// note that passing a string with no spaces before another value will 
// make this string a variable, example: 
halua.info('some message', 'count', 2)
// 00/00/00 00:00:00 INFO some message count=2

// a variable will just output as {variable}={following_value}
```

### options

```ts
import {halua, Level} from 'halua'

let logger = halua.New({
  // specifies min level to log (won't invoke handler if level restriction is not met)
  minLevel: Level.Error,
  // if errorPolicy equals "throw", the possible runtime errors, as insufficient handler method
  // or date getter panic would be thrown into your program
  errorPolicy: 'throw' | 'pass'
})
```

### new instances

```ts
import {halua, Level, JSONHandler, TextHandler} from 'halua'

// this will make a new instance of logger
let logger = halua.New()

// you can pass new handler
let JSONlogger = logger.New(JSONHandler(self.console.log))

// you can pass multiple handlers
let anotherLogger = JSONlogger.New(
  [JSONHandler(self.console.log), TextHandler(self.console.log)]
)

// you can pass options as second or first argument
// if options or handler is absent from arguments - 
// - any absent args would be inherited from current instance
let logger2 = logger.New({minLevel: Level.Warn})
```

### constant arguments

```ts
import {halua} from 'halua'

// returns new instance with any arguments you pass as appended args to log
// any instances created from logger will inherit these arguments, unless you manually
// override them with .New({ postArgs: [] })
let logger = halua.With('operation')

logger.debug('minus sixty one')
// 00/00/00 00:00:00 DEBUG minus sixty one operation
```

### custom handler

```ts
import {Handler} from 'halua'

// can be passed as a handler of an HaluaLogger instance
interface CustomHandler implements Handler {
}
```

inspired by https://pkg.go.dev/log/slog
