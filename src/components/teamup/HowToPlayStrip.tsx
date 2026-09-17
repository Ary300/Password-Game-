type HowToPlayStripProps = {
  projector: boolean
  compact: boolean
}

// Shown through round 1 only, so a first-time class learns the rules and the teacher learns the keys without a guide.
export default function HowToPlayStrip({ projector, compact }: HowToPlayStripProps) {
  let theKeys = null
  if (!projector) {
    theKeys = (
      <p className="mt-1 text-base text-muted">
        <strong className="text-text">Space</strong> starts the turn. <strong className="text-text">Enter</strong> marks correct, <strong className="text-text">S</strong> skips,{' '}
        <strong className="text-text">Space</strong> pauses, <strong className="text-text">U</strong> undoes. <strong className="text-text">?</strong> shows every key.
      </p>
    )
  }
  let theSize = 'text-lg'
  if (projector) {
    theSize = 'text-[clamp(22px,2.8vh,36px)]'
  }
  let theVisibility = ''
  // With a guesser picker and still-to-guess list on a short laptop screen there is no room, and the keys hint can wait.
  if (compact) {
    theVisibility = ' [@media(max-height:760px)]:hidden'
  }
  return (
    <section className={'border-l-8 border-gold bg-surface px-5 py-3' + theVisibility} aria-label="How to play">
      <p className={'font-semibold ' + theSize}>
        <span className="font-extrabold text-gold">How to play. </span>
        The guesser faces away from the screen. Teammates call out one-word clues, never the word or part of it.
      </p>
      {theKeys}
    </section>
  )
}
