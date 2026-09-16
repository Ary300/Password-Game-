type CountdownDisplayProps = {
  secondsLeft: number
  teamName: string
  guesser: string
}

export default function CountdownDisplay({ secondsLeft, teamName, guesser }: CountdownDisplayProps) {
  let theHint = teamName + ' up. Guesser, turn around.'
  if (guesser.length > 0) {
    theHint = teamName + ' up. ' + guesser + ', turn around.'
  }
  return (
    <div className="flex h-full w-full items-stretch" aria-live="assertive">
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-crimson mesh py-[1vh] text-white">
        <span key={secondsLeft} className="display tabular pt-[0.1em]" style={{ fontSize: 'clamp(64px, calc(46vh - 160px), 340px)' }}>
          {secondsLeft}
        </span>
        <span className="mt-1 text-[clamp(16px,2.8vh,32px)] font-bold">{theHint}</span>
      </div>
    </div>
  )
}
