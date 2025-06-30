export let log = {
  message: "log message",
  timestamp: 1751313289663,
  variables: {},
}

export let logWithVars = {
  ...log,
  variables: {
    count: 1,
    attr: "attribute",
    arr: [1, 2, 3],
    symb: Symbol("symb"),
    obj: {
      prop: "value",
      nested: {
        prop: "value",
      },
    },
    mySet: new Set([1, 2, 3, 4, 5]),
    myMap: new Map([["key", "value"]]),
  },
}
