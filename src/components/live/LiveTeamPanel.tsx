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
}

export default function LiveTeamPanel({ teamName, teamColor, totalPoints, guesser, showSwap, onSwap, stats }: LiveTeamPanelProps) {
  let theSwap = null
  if (showSwap) {
    theSwap = (
      <Button
        size="sm"
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
      <div className="flex min-w-0 items-center justify-end gap-3">
        <span className="truncate text-[clamp(20px,2.8vh,30px)] font-extrabold">{guesser}</span>
        {theSwap}
      </div>
    )
  }
  return (
    <div className="flex w-[clamp(360px,32vw,600px)] min-w-0 flex-col">
      <div className="varsity-cut-left mesh flex items-center justify-end py-[1.2vh] pr-6 pl-16" style={{ backgroundColor: teamColor }}>
        <span className="display min-w-0 truncate pt-1 text-[clamp(40px,6.4vh,76px)] text-gold-ink">{teamName}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-end gap-6 pr-6">
        <div className="flex min-w-0 flex-col items-end gap-3">
          {theGuesser}
          {stats}
        </div>
        <span className="display tabular pt-[0.08em] text-[clamp(110px,18vh,210px)] text-gold">{totalPoints}</span>
      </div>
    </div>
  )
}
