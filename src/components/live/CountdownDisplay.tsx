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
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden bg-crimson mesh py-[2vh] text-white">
        <span key={secondsLeft} className="display tabular pt-[0.1em]" style={{ fontSize: 'clamp(160px, 28vh, 340px)' }}>
          {secondsLeft}
        </span>
        <span className="mt-2 text-[clamp(20px,2.8vh,32px)] font-bold">{theHint}</span>
      </div>
    </div>
  )
}
