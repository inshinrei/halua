export function stringMatchesVar(str: string): boolean {
  return str !== "|" && str.trim().indexOf(" ") === -1
}
