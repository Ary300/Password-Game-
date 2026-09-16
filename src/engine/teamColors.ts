// Chosen to stay distinct from each other and from Park Tudor crimson, gold, and the timer's amber and red.
export const TEAM_COLORS = [
  '#4cc9f0',
  '#a3e635',
  '#b388ff',
  '#ff7eb6',
  '#2dd4bf',
  '#7c9cff',
  '#e9d8a6',
  '#ff9f5a',
]

export function teamColorAt(num: number): string {
  const theIndex = ((num % TEAM_COLORS.length) + TEAM_COLORS.length) % TEAM_COLORS.length
  return TEAM_COLORS[theIndex]
}

export function defaultTeamName(num: number): string {
  return 'Team ' + String(num + 1)
}
