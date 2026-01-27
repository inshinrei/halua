export class HaluaFailedToCallHandler extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(`HaluaFailedToCallHandlerError: ${message}`, options)
    }
}

export class HaluaUnableToDetermineHandler extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(`HaluaUnableToDetermineHandlerError: ${message}`, options)
    }
}

export class HaluaParse extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(`HaluaParseError: ${message}`, options)
    }
}
