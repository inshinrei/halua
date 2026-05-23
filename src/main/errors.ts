export function unknownToError(err: unknown): Error {
    if (err instanceof Error) {
        return err
    }

    if (typeof err === "string") {
        return new Error(err)
    }

    let error = ""
    try {
        error = JSON.stringify(err)
    } catch (_) {}
    return new Error(error, { cause: err })
}

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
