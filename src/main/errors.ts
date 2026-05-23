export class HaluaFailedToCallDispatcher extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(`HaluaFailedToCallDispatcherError: ${message}`, options)
    }
}

export class HaluaUnableToDetermineDispatcher extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(`HaluaUnableToDetermineDispatcherError: ${message}`, options)
    }
}

export class HaluaParse extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(`HaluaParseError: ${message}`, options)
    }
}
