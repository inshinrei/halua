import { halua } from '../src'

let logger = halua.New(null, { pretty: true })
logger.debug('debug message')
logger.info('info message')
logger.warn('warning')
logger.err('error message')

logger = halua.With('some operation')
logger.debug('second debug message')
