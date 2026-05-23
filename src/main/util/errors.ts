export function tryReportAnError(err: Error) {
    try {
        let log = typeof self !== "undefined" ? self.console : console
        log.error(err)
    } catch (_) {}
}
