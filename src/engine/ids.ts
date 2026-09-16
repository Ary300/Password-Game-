export function makeId(thePrefix: string): string {
  return thePrefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}
