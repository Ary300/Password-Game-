import type { Standing, Team, TurnResult } from './types'

function csvCell(theValue: string | number): string {
  const theText = String(theValue)
  if (theText.indexOf(',') !== -1 || theText.indexOf('"') !== -1 || theText.indexOf('\n') !== -1) {
    return '"' + theText.replace(/"/g, '""') + '"'
  }
  return theText
}

function teamName(theTeams: Team[], theTeamId: string): string {
  for (let n = 0; n < theTeams.length; n++) {
    if (theTeams[n].id === theTeamId) {
      return theTeams[n].name
    }
  }
  return theTeamId
}

export function resultsToCsv(theStandings: Standing[], theTeams: Team[], theHistory: TurnResult[]): string {
  const theLines: string[] = []
  theLines.push('Rank,Team,Points,Correct,Skipped,Turns')
  for (let n = 0; n < theStandings.length; n++) {
    const theRow = theStandings[n]
    theLines.push(
      [theRow.rank, csvCell(theRow.name), theRow.points, theRow.correct, theRow.skipped, theRow.turns].join(','),
    )
  }
  theLines.push('')
  theLines.push('Round,Team,Guesser,Swapped from,Word,Outcome,Seconds left,Seconds to guess,Points,Note')
  for (let n = 0; n < theHistory.length; n++) {
    const theRow = theHistory[n]
    theLines.push(
      [
        theRow.round,
        csvCell(teamName(theTeams, theRow.teamId)),
        csvCell(theRow.guesser),
        csvCell(theRow.swappedFrom.join(' / ')),
        csvCell(theRow.word),
        theRow.outcome,
        theRow.secondsLeft,
        (theRow.elapsedMs / 1000).toFixed(1),
        theRow.points,
        csvCell(theRow.note),
      ].join(','),
    )
  }
  return theLines.join('\n')
}
