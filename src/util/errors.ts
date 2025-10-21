export class HaluaParseError extends Error {
    constructor(message: string) {
        super(`HaluaParseError: ${message}`)
    }
}
