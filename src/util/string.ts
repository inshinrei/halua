export function printTimes(n: number, value: string) {
    let str = ""
    for (let i = n; i !== 0; i -= 1) {
        str += value
    }
    return str
}
