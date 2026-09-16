import { UNLIMITED_ROUNDS } from '../../engine/defaults'

export default function RoundLabel({ round, roundsPerGame, className = '' }: { round: number; roundsPerGame: number; className?: string }) {
  let theText = 'Round ' + String(round)
  if (roundsPerGame !== UNLIMITED_ROUNDS) {
    theText = theText + ' of ' + String(roundsPerGame)
  }
  return <span className={'tabular ' + className}>{theText}</span>
}
