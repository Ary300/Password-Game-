import type { ClueVerdict } from '../../engine/clueCheck'
import { clueRuleNumber } from './clueRuleNumber'

type ClueVerdictPanelProps = {
  verdict: ClueVerdict | null
  waitingText: string
}

export default function ClueVerdictPanel({ verdict, waitingText }: ClueVerdictPanelProps) {
  if (verdict === null) {
    return (
      <div className="flex min-h-32 items-center bg-surface-2 px-6 py-5" aria-live="polite">
        <p className="display text-4xl text-faint">{waitingText}</p>
      </div>
    )
  }

  const theMatchup = (
    <p className="mt-2 text-lg font-semibold">
      {verdict.clue} for {verdict.word}
    </p>
  )

  if (verdict.allowed) {
    return (
      <div className="min-h-32 bg-good px-6 py-5 text-gold-ink" aria-live="polite">
        <p className="display text-[64px]">Allowed</p>
        {theMatchup}
      </div>
    )
  }

  const theReasons = []
  for (let n = 0; n < verdict.reasons.length; n++) {
    const theRule = clueRuleNumber(verdict.reasons[n])
    let theNumber = 'List'
    if (theRule > 0) {
      theNumber = String(theRule)
    }
    theReasons.push(
      <li key={n} className="flex items-baseline gap-3 border-b border-line/60 py-2 last:border-b-0">
        <span className="display w-8 shrink-0 text-2xl text-crimson-text">{theNumber}</span>
        <span className="text-lg font-semibold">{verdict.reasons[n]}</span>
      </li>,
    )
  }

  return (
    <div aria-live="polite">
      <div className="min-h-32 bg-crimson px-6 py-5 text-white">
        <p className="display text-[64px]">Not allowed</p>
        {theMatchup}
      </div>
      <ol className="mt-2">{theReasons}</ol>
      <p className="mt-2 text-base text-muted">To settle it, close this and press U to take back a Correct, or S to skip the word.</p>
    </div>
  )
}
