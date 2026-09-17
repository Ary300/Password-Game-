import type { MouseEvent, ReactNode } from 'react'
import Button from '../ui/Button'

type LiveTeamPanelProps = {
  teamName: string
  teamColor: string
  totalPoints: number
  guesser: string
  showSwap: boolean
  onSwap: () => void
  stats: ReactNode
  scoreControl?: ReactNode
}

export default function LiveTeamPanel({ teamName, teamColor, totalPoints, guesser, showSwap, onSwap, stats, scoreControl = null }: LiveTeamPanelProps) {
  let theSwap = null
  if (showSwap) {
    theSwap = (
      <Button
        size="md"
        hotkey="G"
        onClick={(theEvent: MouseEvent<HTMLButtonElement>) => {
          theEvent.currentTarget.blur()
          onSwap()
        }}
      >
        Swap
      </Button>
    )
  }
  let theGuesser = null
  if (guesser.length > 0 || theSwap !== null) {
    theGuesser = (
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="label text-[clamp(18px,2.4vh,28px)]">Guessing</span>
        <div className="flex min-w-0 items-center gap-4">
          <span className="display min-w-0 truncate pt-[0.06em] text-[clamp(40px,6vh,68px)]">{guesser}</span>
          {theSwap}
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-[clamp(380px,34vw,640px)] min-w-0 max-[899px]:w-[300px] flex-col max-[1199px]:[&_kbd]:hidden">
      <div className="varsity-cut-left mesh flex items-center justify-end py-[1.2vh] pr-8 pl-16" style={{ backgroundColor: teamColor }}>
        <span className="display min-w-0 truncate pt-1 text-[clamp(44px,7vh,84px)] text-gold-ink">{teamName}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-between gap-6 pt-4 pr-8 pl-16 max-[1199px]:gap-3 max-[1199px]:pr-5 max-[1199px]:pl-10 max-[899px]:pr-4 max-[899px]:pl-6">
        <div className="flex min-w-0 flex-col items-start gap-3 pb-2">
          {theGuesser}
          {stats}
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="display tabular pt-[0.08em] text-[clamp(96px,18vh,210px)] text-gold">{totalPoints}</span>
          <div className="flex items-center gap-3">
            {scoreControl}
            <span className="label text-lg max-[899px]:hidden">Total</span>
          </div>
        </div>
      </div>
    </div>
  )
}
