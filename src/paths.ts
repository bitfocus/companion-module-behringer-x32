export function MutePath(prefix: string): string {
  return `${MainPath(prefix)}/on`
}

export function MainPath(prefix: string): string {
  return prefix.indexOf('dca/') !== -1 ? `${prefix}` : `${prefix}/mix`
}
