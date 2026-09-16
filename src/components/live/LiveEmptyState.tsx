import { useNavigate } from 'react-router-dom'
import type { GamePhase } from '../../engine/types'
import Button from '../ui/Button'

export default function LiveEmptyState({ phase, projector }: { phase: GamePhase; projector: boolean }) {
  const theNavigate = useNavigate()
  let theTitle = 'No turn running'
  let theTarget = '/teamup'
  let theAction = 'Go to Team up'
  if (phase === 'setup' || phase === 'podium') {
    theTitle = 'No game running'
    theTarget = '/'
    theAction = 'Set up a game'
  }
  let theButton = null
  if (!projector) {
    theButton = (
      <Button variant="primary" size="lg" className="mt-8" onClick={() => theNavigate(theTarget)}>
        {theAction}
      </Button>
    )
  }
  return (
    <section className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="display text-[clamp(64px,10vh,120px)]">{theTitle}</h1>
      {theButton}
    </section>
  )
}
