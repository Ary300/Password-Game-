import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import ClueCheckerForm from './clue/ClueCheckerForm'
import Modal from './ui/Modal'

export default function ClueChecker() {
  const theOpen = useGameStore((theState) => theState.clueCheckerOpen)
  const setClueCheckerOpen = useGameStore((theState) => theState.setClueCheckerOpen)
  const thePausedByUs = useRef(false)

  // A dispute should not cost the team clock time, but a turn the teacher already paused stays paused.
  useEffect(() => {
    const theState = useGameStore.getState()
    const theTurn = theState.game.turn
    const theNow = Date.now()
    if (theOpen) {
      if (theState.game.phase === 'live' && theTurn !== null && theTurn.pausedAt === null && theTurn.end === null) {
        theState.togglePause(theNow)
        thePausedByUs.current = true
      }
      return
    }
    if (thePausedByUs.current) {
      thePausedByUs.current = false
      if (theState.game.phase === 'live' && theTurn !== null && theTurn.pausedAt !== null && theTurn.end === null) {
        theState.togglePause(theNow)
      }
    }
  }, [theOpen])

  return (
    <Modal open={theOpen} onOpenChange={setClueCheckerOpen} title="Clue checker" width="max-w-3xl">
      <ClueCheckerForm />
    </Modal>
  )
}
