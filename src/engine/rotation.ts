import type { Player, Team, TurnStart } from './types'

export function presentPlayers(theTeam: Team, theAbsentIds: string[]): Player[] {
  const thePlayers: Player[] = []
  for (let n = 0; n < theTeam.players.length; n++) {
    if (theAbsentIds.indexOf(theTeam.players[n].id) === -1) {
      thePlayers.push(theTeam.players[n])
    }
  }
  return thePlayers
}

export function guessCount(thePlayerId: string, theLog: TurnStart[]): number {
  let theCount = 0
  for (let n = 0; n < theLog.length; n++) {
    if (theLog[n].guesserId === thePlayerId) {
      theCount = theCount + 1
    }
  }
  return theCount
}

function lastGuessedAt(thePlayerId: string, theLog: TurnStart[]): number {
  let theAt = -1
  for (let n = 0; n < theLog.length; n++) {
    if (theLog[n].guesserId === thePlayerId && theLog[n].at > theAt) {
      theAt = theLog[n].at
    }
  }
  return theAt
}

// Fewest turns first, then whoever went longest ago, then roster order, so everyone guesses before anyone repeats.
export function defaultGuesserId(theTeam: Team, theLog: TurnStart[], theAbsentIds: string[]): string | null {
  const thePlayers = presentPlayers(theTeam, theAbsentIds)
  let theBestId: string | null = null
  let theBestCount = Number.MAX_SAFE_INTEGER
  let theBestAt = Number.MAX_SAFE_INTEGER
  for (let n = 0; n < thePlayers.length; n++) {
    const theCount = guessCount(thePlayers[n].id, theLog)
    const theAt = lastGuessedAt(thePlayers[n].id, theLog)
    if (theCount < theBestCount || (theCount === theBestCount && theAt < theBestAt)) {
      theBestId = thePlayers[n].id
      theBestCount = theCount
      theBestAt = theAt
    }
  }
  return theBestId
}

export function resolveGuesserId(theTeam: Team, theLog: TurnStart[], theAbsentIds: string[]): string | null {
  if (theTeam.pickedGuesserId !== null && theAbsentIds.indexOf(theTeam.pickedGuesserId) === -1) {
    for (let n = 0; n < theTeam.players.length; n++) {
      if (theTeam.players[n].id === theTeam.pickedGuesserId) {
        return theTeam.pickedGuesserId
      }
    }
  }
  return defaultGuesserId(theTeam, theLog, theAbsentIds)
}

export function playerName(theTeam: Team, thePlayerId: string | null): string {
  if (thePlayerId === null) {
    return ''
  }
  for (let n = 0; n < theTeam.players.length; n++) {
    if (theTeam.players[n].id === thePlayerId) {
      return theTeam.players[n].name
    }
  }
  return ''
}

export function playersYetToGuess(theTeam: Team, theLog: TurnStart[], theAbsentIds: string[]): Player[] {
  const thePlayers = presentPlayers(theTeam, theAbsentIds)
  const theWaiting: Player[] = []
  for (let n = 0; n < thePlayers.length; n++) {
    if (guessCount(thePlayers[n].id, theLog) === 0) {
      theWaiting.push(thePlayers[n])
    }
  }
  return theWaiting
}

export function nextTeamIndex(theCurrent: number, theTeamCount: number): { index: number; wrapped: boolean } {
  const theNext = theCurrent + 1
  if (theNext >= theTeamCount) {
    return { index: 0, wrapped: true }
  }
  return { index: theNext, wrapped: false }
}
