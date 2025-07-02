export let log = {
  timestamp: 1751313289663,
  args: ["log message"],
}

export let logWithVars = {
  ...log,
  args: [
    "log message",
    "count",
    1,
    "arr",
    [1, 2, 3],
    "symb",
    Symbol("symb"),
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
