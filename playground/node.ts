import { halua, Level } from '../src'
import { JSONHandler } from '../src/JSONHandler'

let logger = halua.New(console, { pretty: true, minLevel: Level.Info })
logger.debug('debug message', 'count', 5)
logger.info('info message')
logger.warn('warning')
logger.err('error message')

let logger2 = halua.With('some operation')
logger2.debug('second debug message', 'count', 2, 'other count', true, [1, 2, 3], { prop: 'aboba '})

logger = logger.New()
logger.info('third info message')
