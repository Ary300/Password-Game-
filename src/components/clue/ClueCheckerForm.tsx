import { useMemo, useState } from 'react'
import { checkClue, parseBannedList } from '../../engine/clueCheck'
import { KNOWN_WORDS } from '../../data/wordData'
import { useGameStore } from '../../store/useGameStore'
import ClueRulesList from './ClueRulesList'
import ClueVerdictPanel from './ClueVerdictPanel'
import { clueRuleNumber } from './clueRuleNumber'

const theInputStyle =
  'h-16 w-full border-b-4 border-line bg-surface-2 px-4 text-3xl font-bold text-text placeholder:font-normal placeholder:text-faint focus:border-gold focus:outline-none'

// Mounted fresh each time the modal opens, so the word always starts from the live turn.
export default function ClueCheckerForm() {
  const theLiveWord = useGameStore((theState) => {
    if (theState.game.turn === null) {
      return ''
    }
    return theState.game.turn.word.word
  })
  const theBannedText = useGameStore((theState) => theState.settings.customBanned)
  const [theWord, setTheWord] = useState(theLiveWord)
  const [theClue, setTheClue] = useState('')

  const theBanned = useMemo(() => parseBannedList(theBannedText), [theBannedText])

  let theVerdict = null
  let theWaiting = 'Enter a word and a clue'
  if (theWord.trim().length > 0 && theClue.trim().length === 0) {
    theWaiting = 'Enter the clue'
  }
  if (theWord.trim().length > 0 && theClue.trim().length > 0) {
    theVerdict = checkClue(theClue, theWord, theBanned, KNOWN_WORDS)
  }

  const theFired: number[] = []
  if (theVerdict !== null) {
    for (let n = 0; n < theVerdict.reasons.length; n++) {
      theFired.push(clueRuleNumber(theVerdict.reasons[n]))
    }
  }

  let theWordLabel = 'Word'
  if (theLiveWord.length > 0) {
    theWordLabel = 'Word (from this turn)'
  }

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clue-check-word" className="label mb-1.5 block">
            {theWordLabel}
          </label>
          <input
            id="clue-check-word"
            value={theWord}
            onChange={(theEvent) => setTheWord(theEvent.target.value)}
            autoFocus={theLiveWord.length === 0}
            autoComplete="off"
            spellCheck={false}
            className={theInputStyle}
          />
        </div>
        <div>
          <label htmlFor="clue-check-clue" className="label mb-1.5 block">
            Clue someone said
          </label>
          <input
            id="clue-check-clue"
            value={theClue}
            onChange={(theEvent) => setTheClue(theEvent.target.value)}
            autoFocus={theLiveWord.length > 0}
            autoComplete="off"
            spellCheck={false}
            className={theInputStyle}
          />
        </div>
      </div>
      <ClueVerdictPanel verdict={theVerdict} waitingText={theWaiting} />
      <ClueRulesList bannedCount={theBanned.length} firedRules={theFired} />
    </div>
  )
}
