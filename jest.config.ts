import type { Config } from 'jest'

const config: Config = {
    transform: {
        "^.+\\.(t|j)sx?$": "ts-jest"
    },
    testRegex: "((\\_|/)(test|spec))\\.(jsx?|tsx?)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"]
}

export default config