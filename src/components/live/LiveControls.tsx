import type { MouseEvent } from 'react'
import Button from '../ui/Button'

type LiveControlsProps = {
  paused: boolean
  counting: boolean
  skipsLeft: number
  onCorrect: () => void
  onSkip: () => void
  onPause: () => void
  onEnd: () => void
  onUndo: () => void
}

// Clicked buttons drop focus so the next Space or Enter goes to the hotkeys instead of re-pressing the button.
function blurThen(theAction: () => void) {
  return (theEvent: MouseEvent<HTMLButtonElement>) => {
    theEvent.currentTarget.blur()
    theAction()
  }
}

export default function LiveControls({ paused, counting, skipsLeft, onCorrect, onSkip, onPause, onEnd, onUndo }: LiveControlsProps) {
  let thePauseLabel = 'Pause'
  let thePauseVariant: 'gold' | 'secondary' = 'secondary'
  if (paused) {
    thePauseLabel = 'Resume'
    thePauseVariant = 'gold'
  }
  return (
    <div className="mx-auto grid w-full max-w-[640px] grid-cols-3 gap-1.5" role="group" aria-label="Turn controls">
      <Button variant="good" size="xl" hotkey="Enter" className="col-span-3" disabled={counting} onClick={blurThen(onCorrect)}>
        Correct
      </Button>
      <Button size="lg" hotkey="S" disabled={counting || skipsLeft <= 0} onClick={blurThen(onSkip)}>
        Skip {skipsLeft}
      </Button>
      <Button size="lg" variant={thePauseVariant} hotkey="Space" onClick={blurThen(onPause)}>
        {thePauseLabel}
      </Button>
      <Button size="lg" variant="danger" hotkey="Esc" onClick={blurThen(onEnd)}>
        End turn
      </Button>
      <Button size="sm" variant="ghost" hotkey="U" className="col-span-3" onClick={blurThen(onUndo)}>
        Undo
      </Button>
    </div>
  )
}
