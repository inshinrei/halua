export function tryReportAnError(err: Error) {
    try {
        self?.console?.error(err)
    } catch (_) {}
}
