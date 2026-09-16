import { useNavigate } from 'react-router-dom'
import { routeForPhase } from '../../hooks/usePhaseRoute'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'

type PodiumActionsProps = {
  final: boolean
  onExport: () => void
}

export default function PodiumActions({ final, onExport }: PodiumActionsProps) {
  const theNavigate = useNavigate()
  const thePhase = useGameStore((theState) => theState.game.phase)
  const playAgain = useGameStore((theState) => theState.playAgain)
  const newGame = useGameStore((theState) => theState.newGame)

  let theMain = null
  if (final) {
    theMain = (
      <Button variant="primary" size="lg" className="w-full" hotkey="Enter" onClick={playAgain}>
        Play again
      </Button>
    )
  } else if (thePhase === 'teamup' || thePhase === 'live') {
    theMain = (
      <Button variant="primary" size="lg" className="w-full" onClick={() => theNavigate(routeForPhase(thePhase))}>
        Resume game
      </Button>
    )
  }

  let theNewGame = null
  if (final) {
    theNewGame = <Button onClick={newGame}>New game</Button>
  }

  return (
    <div className="flex w-full shrink-0 flex-col justify-end gap-2 lg:w-[24rem]">
      {theMain}
      <div className="flex gap-2 [&>button]:flex-1">
        {theNewGame}
        <Button onClick={onExport}>Export CSV</Button>
        <Button onClick={() => theNavigate('/leaderboard')}>View history</Button>
      </div>
    </div>
  )
}
