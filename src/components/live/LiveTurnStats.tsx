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
      <div className="flex items-end gap-5">
        <span className="flex flex-col items-start">
          <span className="display tabular text-4xl text-good">
            {theSign}
            {turnPoints}
          </span>
          <span className="label text-base whitespace-nowrap">this turn</span>
        </span>
        <span className="flex flex-col items-start">
          <span className="display tabular text-4xl">{skipsLeft}</span>
          <span className="label text-base whitespace-nowrap">{theSkipText}</span>
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
