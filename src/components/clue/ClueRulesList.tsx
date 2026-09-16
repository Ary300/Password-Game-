type ClueRulesListProps = {
  bannedCount: number
  firedRules: number[]
}

const theRules = [
  'Clue is the word.',
  'Clue contains the word, or the word contains the clue (4+ letters).',
  'Same root after dropping s, es, ed, ing, er, est, ly.',
  'One or two letters off (words of 5+ letters).',
  'Clue is part of a compound word, like sun in sunflower.',
]

export default function ClueRulesList({ bannedCount, firedRules }: ClueRulesListProps) {
  const theItems = []
  for (let n = 0; n < theRules.length; n++) {
    let theNumberStyle = 'text-faint'
    let theTextStyle = 'text-muted'
    if (firedRules.indexOf(n + 1) !== -1) {
      theNumberStyle = 'text-crimson-text'
      theTextStyle = 'text-text font-semibold'
    }
    theItems.push(
      <li key={n} className="flex items-baseline gap-3 py-1">
        <span className={'display w-8 shrink-0 text-xl ' + theNumberStyle}>{n + 1}</span>
        <span className={'text-sm ' + theTextStyle}>{theRules[n]}</span>
      </li>,
    )
  }

  let theBannedNote = 'Rhymes and translations are allowed unless they are on the class banned list.'
  if (bannedCount > 0) {
    theBannedNote = 'Rhymes and translations are allowed unless they are on the class banned list (' + String(bannedCount) + ').'
  }

  return (
    <div className="mt-6">
      <h3 className="display text-2xl">Banned if</h3>
      <div className="mt-1.5 mb-2 h-1 bg-crimson" aria-hidden="true" />
      <ol>{theItems}</ol>
      <p className="label mt-2">{theBannedNote}</p>
    </div>
  )
}
