import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useGameStore } from '../../store/useGameStore'
import EndGameModal from '../leaderboard/EndGameModal'

// The confirm pauses a running clock so deciding does not cost the team time; backing out resumes it.
export default function EndGameButton({ className = '' }: { className?: string }) {
  const [theOpen, setTheOpen] = useState(false)
  const thePausedByUs = useRef(false)
  const theHeldByUs = useRef(false)
  const theClassGame = useGameStore((theState) => theState.game.mode === 'class')

  function openConfirm(theEvent: MouseEvent<HTMLButtonElement>) {
    theEvent.currentTarget.blur()
    const theState = useGameStore.getState()
    const theTurn = theState.game.turn
    thePausedByUs.current = false
    if (theState.game.phase === 'live' && theTurn !== null && theTurn.end === null && theTurn.pausedAt === null) {
      theState.togglePause(Date.now())
      thePausedByUs.current = true
    }
    // A hand-off countdown behind the dialog would start the next turn while the teacher is still deciding.
    theHeldByUs.current = false
    if (theState.game.phase === 'teamup' && theState.game.handoffEndsAt !== null) {
      theState.holdHandoff(true, Date.now())
      theHeldByUs.current = true
    }
    setTheOpen(true)
  }

  function closeConfirm(theNextOpen: boolean) {
    if (theNextOpen) {
      return
    }
    setTheOpen(false)
    if (theHeldByUs.current) {
      theHeldByUs.current = false
      const theState = useGameStore.getState()
      if (theState.game.phase === 'teamup' && theState.game.handoffHeld) {
        theState.holdHandoff(false, Date.now())
      }
    }
    if (thePausedByUs.current) {
      thePausedByUs.current = false
      const theState = useGameStore.getState()
      const theTurn = theState.game.turn
      if (theState.game.phase === 'live' && theTurn !== null && theTurn.pausedAt !== null && theTurn.end === null) {
        theState.togglePause(Date.now())
      }
    }
  }

  function confirmEnd() {
    thePausedByUs.current = false
    theHeldByUs.current = false
    setTheOpen(false)
    useGameStore.getState().endGame()
  }

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        className={'inline-flex h-9 items-center px-3 text-sm font-bold text-muted transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-gold ' + className}
      >
        End game
      </button>
      <EndGameModal open={theOpen} classGame={theClassGame} onOpenChange={closeConfirm} onConfirm={confirmEnd} />
    </>
  )
}
