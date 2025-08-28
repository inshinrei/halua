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
