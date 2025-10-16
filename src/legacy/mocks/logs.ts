import { Level, Log } from "../handlers/types"

export let log: Log = {
    timestamp: 1751313289663,
    args: ["log message"],
    level: Level.Debug,
    leveling: [Level.Debug, 0],
    messageFormat: "%t %l %a | %w",
}

export let logWithArgs = {
    ...log,
    withArgs: ["count", 2, [1, 2, 3], "arr", "anotherCount", 5],
}

export let logArrayOfObjects = {
    ...log,
    args: [
        [
            { prop: "value", type: "string" },
            { prop: "number", type: "string" },
        ],
    ],
}

export let logWithVars = {
    ...log,
    args: [
        "log message",
        "count",
        1,
        "arr",
        [1, 2, 3],
        "obj",
        {
            prop: "value",
            nested: { prop: "value" },
        },
        "mySet",
        new Set([1, 2, 3, 4, 5]),
        "myMap",
        new Map([["key", "value"]]),
        [1, 2, 3],
        [5, 6, 7],
    ],
}

let object = { field: "of value" }
let objectNested = { field: "value", nesting: { prop: { nestedProp: "value2" } } }
let objectComplex = { field: "value", map: new Map([["key", "value"]]), set: new Set([1, 2]) }
let arrayOfNumber = [1, 2, 3, 4, 5]
let arrayOfObjects = [{ prop: "value" }, { type: "propped" }]
let arrayMixed = [1, 2, [{ prop: 1 }], new Set([1, 2, 3, 4, 5]), objectComplex]

export let mockLogSimple: Log = {
    timestamp: 1751313289663,
    args: ["log message"],
    level: Level.Debug,
    leveling: [Level.Debug, 0],
    messageFormat: "%t %l %a | %w",
}

export let mockLogWithArgs: Log = {
    ...mockLogSimple,
    withArgs: ["count", 2, ["array of", "not strings", 3, 4], "count", 22],
    args: [object, arrayOfNumber],
}

export let mockLogWithComplexStructs: Log = {
    ...mockLogSimple,
    args: [objectNested, arrayOfObjects, arrayMixed],
}
