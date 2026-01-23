export function tryReportAnError(err: Error) {
    try {
        let log = "self" in window ? self.console : console
        log.error(err)
    } catch (_) {}
}
