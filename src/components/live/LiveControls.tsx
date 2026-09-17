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

// Narrow windows hide the key caps: the column is too thin for a label and a cap side by side.
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
    <div className="mx-auto grid w-full max-w-[760px] grid-cols-2 gap-1.5 2xl:grid-cols-4 max-[1199px]:[&_kbd]:hidden max-[1199px]:[&>button]:px-3" role="group" aria-label="Turn controls">
      <Button variant="good" size="xl" hotkey="Enter" className="col-span-2 2xl:col-span-4" disabled={counting} onClick={blurThen(onCorrect)}>
        Correct
      </Button>
      <Button size="lg" hotkey="S" disabled={counting || skipsLeft <= 0} onClick={blurThen(onSkip)}>
        Skip <span className="text-lg opacity-75">{skipsLeft} left</span>
      </Button>
      <Button size="lg" variant={thePauseVariant} hotkey="Space" onClick={blurThen(onPause)}>
        {thePauseLabel}
      </Button>
      <Button size="lg" hotkey="U" onClick={blurThen(onUndo)}>
        Undo
      </Button>
      <Button size="lg" variant="danger" hotkey="Esc" onClick={blurThen(onEnd)}>
        End turn
      </Button>
    </div>
  )
}
