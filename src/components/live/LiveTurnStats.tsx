type LiveTurnStatsProps = {
  turnPoints: number
  skipsLeft: number
  size: 'sm' | 'lg'
}

export default function LiveTurnStats({ turnPoints, skipsLeft, size }: LiveTurnStatsProps) {
  let theSign = '+'
  if (turnPoints < 0) {
    theSign = ''
  }
  let theSkipText = 'skips left'
  if (skipsLeft === 1) {
    theSkipText = 'skip left'
  }
  if (size === 'sm') {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <span className="tabular text-2xl font-extrabold text-good">
          {theSign}
          {turnPoints} this turn
        </span>
        <span className="tabular label text-base">
          {skipsLeft} {theSkipText}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-end justify-center gap-[4vw]">
      <div className="flex flex-col items-center">
        <span className="display tabular text-[clamp(96px,15vh,180px)] text-good">
          {theSign}
          {turnPoints}
        </span>
        <span className="label text-lg">this turn</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="display tabular text-[clamp(96px,15vh,180px)]">{skipsLeft}</span>
        <span className="label text-lg">{theSkipText}</span>
      </div>
    </div>
  )
}
