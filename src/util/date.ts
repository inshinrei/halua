export function getPrettyDate(t: number) {
    let d = new Date(t)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}
