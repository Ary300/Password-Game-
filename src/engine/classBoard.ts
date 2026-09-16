import type { ClassRoom, ClassStanding, ClassTotals } from './types'

function averageOf(theTotals: ClassTotals): number {
  if (theTotals.turns === 0) {
    return 0
  }
  return theTotals.correct / theTotals.turns
}

// Classes with no turns yet sit at the bottom so a brand-new class does not outrank one that has played.
export function computeClassStandings(theClasses: ClassRoom[], theLive: { classId: string; totals: ClassTotals } | null): ClassStanding[] {
  const theRows: ClassStanding[] = []
  for (let n = 0; n < theClasses.length; n++) {
    const theClass = theClasses[n]
    let theTotals = theClass.totals
    if (theLive !== null && theLive.classId === theClass.id) {
      theTotals = {
        games: theTotals.games + theLive.totals.games,
        turns: theTotals.turns + theLive.totals.turns,
        correct: theTotals.correct + theLive.totals.correct,
      }
    }
    theRows.push({
      rank: 0,
      classId: theClass.id,
      name: theClass.name,
      games: theTotals.games,
      turns: theTotals.turns,
      correct: theTotals.correct,
      average: averageOf(theTotals),
    })
  }
  theRows.sort(function (theA, theB) {
    if (theA.turns === 0 && theB.turns > 0) {
      return 1
    }
    if (theB.turns === 0 && theA.turns > 0) {
      return -1
    }
    if (theB.average !== theA.average) {
      return theB.average - theA.average
    }
    return theB.correct - theA.correct
  })
  for (let n = 0; n < theRows.length; n++) {
    if (n > 0 && theRows[n - 1].average === theRows[n].average && theRows[n - 1].turns > 0 && theRows[n].turns > 0) {
      theRows[n].rank = theRows[n - 1].rank
    } else {
      theRows[n].rank = n + 1
    }
  }
  return theRows
}
