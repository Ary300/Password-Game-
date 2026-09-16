import { useNavigate } from 'react-router-dom'
import type { GamePhase } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'

type EmptyCopy = {
  title: string
  body: string
  primary: string
  secondary: string
}

function copyFor(thePhase: GamePhase): EmptyCopy {
  if (thePhase === 'live') {
    return { title: 'A turn is running', body: 'The clock is on the Live screen.', primary: 'Back to Live', secondary: '' }
  }
  if (thePhase === 'teamup') {
    return { title: 'No turn running', body: 'The next team is waiting on Team up.', primary: 'Go to Team up', secondary: '' }
  }
  if (thePhase === 'podium') {
    return { title: 'Game over', body: 'Start another game with the same teams, or see the podium.', primary: 'Play again', secondary: 'See the podium' }
  }
  return { title: 'No game running', body: 'Start a quick game with the teams from Setup, or change them first.', primary: 'Start quick game', secondary: 'Set up teams' }
}

export default function LiveEmptyState({ phase, projector }: { phase: GamePhase; projector: boolean }) {
  const theNavigate = useNavigate()
  const theCopy = copyFor(phase)

  function runPrimary() {
    const theState = useGameStore.getState()
    if (phase === 'live') {
      theNavigate('/live')
    } else if (phase === 'teamup') {
      theNavigate('/teamup')
    } else if (phase === 'podium') {
      theState.playAgain()
    } else {
      theState.quickGame()
    }
  }

  function runSecondary() {
    if (phase === 'podium') {
      theNavigate('/podium')
    } else {
      theNavigate('/')
    }
  }

  let theActions = null
  if (!projector) {
    let theSecondary = null
    if (theCopy.secondary.length > 0) {
      theSecondary = (
        <Button size="lg" onClick={runSecondary}>
          {theCopy.secondary}
        </Button>
      )
    }
    theActions = (
      <div className="mt-8 flex flex-wrap justify-center gap-1.5">
        <Button variant="primary" size="xl" onClick={runPrimary} autoFocus>
          {theCopy.primary}
        </Button>
        {theSecondary}
      </div>
    )
  }
  let theBody = null
  if (!projector) {
    theBody = <p className="mt-4 text-2xl text-muted">{theCopy.body}</p>
  }
  return (
    <section className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="display text-[clamp(64px,10vh,120px)]">{theCopy.title}</h1>
      {theBody}
      {theActions}
    </section>
  )
}
