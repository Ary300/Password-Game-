import { motion } from 'motion/react'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { RESULT_BANNER_MS } from '../../engine/defaults'
import type { TurnEnd } from '../../engine/types'
import Button from '../ui/Button'

type ResultBannerProps = {
  end: TurnEnd
  revealWord: boolean
  autoAdvance: boolean
  showNextButton: boolean
  showPeek: boolean
  pointsText: string
  onNext: () => void
  onUndo: () => void
}

export default function ResultBanner({ end, revealWord, autoAdvance, showNextButton, showPeek, pointsText, onNext, onUndo }: ResultBannerProps) {
  const [thePeeked, setThePeeked] = useState(false)
  let theTitle = "Time's up"
  let theBand = 'bg-crimson stripes text-white'
  let theBar = 'bg-white'
  if (end.outcome === 'ended') {
    theTitle = 'Turn over'
  }
  if (end.outcome === 'correct') {
    theTitle = 'Correct'
    theBand = 'bg-good stripes text-gold-ink'
    theBar = 'bg-gold-ink'
  }
  let theWord = null
  let thePeek = null
  if (revealWord || end.outcome === 'correct' || thePeeked) {
    theWord = (
      <p className="mt-[2vh] pb-[0.12em] font-display text-[clamp(96px,22vh,280px)] leading-[0.9] font-black lowercase">{end.word}</p>
    )
  } else if (showPeek) {
    thePeek = (
      <Button
        size="lg"
        onClick={(theEvent: MouseEvent<HTMLButtonElement>) => {
          theEvent.currentTarget.blur()
          setThePeeked(true)
        }}
      >
        Show word
      </Button>
    )
  }
  let thePoints = null
  if (pointsText.length > 0) {
    thePoints = <p className="display tabular mt-[2vh] text-[clamp(32px,5vh,60px)]">{pointsText}</p>
  }
  // The band covers the turn controls, so the teacher window repeats Undo here for a mistaken Correct or End turn.
  let theTools = null
  if (showPeek) {
    theTools = (
      <div className="mt-[3vh] flex gap-1.5">
        {thePeek}
        <Button
          size="lg"
          hotkey="U"
          onClick={(theEvent: MouseEvent<HTMLButtonElement>) => {
            theEvent.currentTarget.blur()
            onUndo()
          }}
        >
          Undo
        </Button>
      </div>
    )
  }
  // The bar starts from however much banner time is left, so a projector window that joins late stays in step.
  const theLeftMs = Math.max(0, RESULT_BANNER_MS - (Date.now() - end.at))
  let theFooter = null
  if (autoAdvance) {
    theFooter = (
      <div className="mt-[5vh] h-2 w-full max-w-[640px] bg-black/20">
        <motion.div
          className={'h-full origin-left ' + theBar}
          initial={{ scaleX: theLeftMs / RESULT_BANNER_MS }}
          animate={{ scaleX: 0 }}
          transition={{ duration: theLeftMs / 1000, ease: 'linear' }}
        />
      </div>
    )
  } else if (showNextButton) {
    theFooter = (
      <Button variant="gold" size="xl" hotkey="N" onClick={onNext} className="mt-[3vh]">
        Next team
      </Button>
    )
  }
  return (
    <div className="absolute inset-0 z-30 flex items-center bg-bg" role="status" aria-live="assertive">
      <div className={'flex w-full flex-col items-center px-8 py-[5vh] text-center ' + theBand}>
        <span className="display text-[clamp(90px,14vh,180px)]">{theTitle}</span>
        {theWord}
        {thePoints}
        {theTools}
        {theFooter}
      </div>
    </div>
  )
}
