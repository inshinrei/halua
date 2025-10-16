export function makeArgsGenerator(...args: any[]) {
    return argsgen(parseArg, ...args)
}

export function* argsgen(parser, ...args: any[]) {
    for (let a of args) {
        yield parser(a)
    }
}

export function parseArg<T extends any>(value: T): { bare: T; parsed: any } {
    return { bare: value, parsed: value }
}
