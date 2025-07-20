export function replaceDataBeforeStringify(value: any): any {
  if (typeof value === "symbol") {
    return value.toString()
  }
  if (value instanceof Set) {
    return Array.from(value)
  }
  if (value instanceof Map) {
    let obj: Record<string, any> = {}
    for (let key of value.keys()) {
      obj[key] = value.get(key)
    }
    return obj
  }
  return value
}
