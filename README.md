# halua
logger for JS/TS projects (mainly for browser, but logging handler could be replaced with your implementation). inspired by https://pkg.go.dev/log/slog

### insallation
```
pnpm i halua
// or 
npm i halua
// or
yarn i halua
```

### calling signature
works for .debug, .info, .warn, .err
```typescript
import { halua } from 'halua'

halua.debug('message', 'count', 2, 'some other info', true)
// output:
// {timestamp} {logging level} message count="2" some other info="true"
// 00/00/00 00:00:00 DEBUG message count="2" some other info="true"
```
the logging func accepts string as a message for the first argument, the following argumets are [key, value] to append 
to a total log 

### creating new instances
```typescript
import { halua } from 'halua'

// make new instance
let logger = halua.New()

// make new instance with postfix, this method will inherit dateGetter and handler 
logger = halua.With('operation')
// will log as "{date} {level} {msg} {...args} operation"
```

### controlling logging level
```typescript
import { halua, Level } from 'halua'

const logger = halua.New(null, { minLevel: Level.Warn })
// now logger won't output .debug and .info logs
// Levels sequence: Debug, Info, Warn, Error
```

### replacing logging with custom handler
The resulting log string will be sent to handler's method
```typescript
import { Handler, halua } from 'halua'

class CustomHandler implements Handler {
  debug(msg: string) {}
  info(msg: string) {}
  warn(msg: string) {}
  error(msg: string) {}
}

// handler is replaced for current and future instances 
halua.setHandler(CustomHandler)
```

### replacing date getter
```typescript
import { halua } from 'halua'

halua.setDateGetter(() => performance.now())
// will output performance stamp instead of Date (for this and future instances)
```

### using basic logging
```typescript
import { halua } from 'halua'

// debug level 
halua.debug('debug message')
// info level 
halua.info('info message')

// warning level
halua.warn('warning')
// error level
halua.err('err message')
```

