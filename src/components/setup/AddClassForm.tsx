import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { parseNames } from '../../engine/roster'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'

type AddClassFormProps = {
  onDone?: () => void
  autoFocus?: boolean
}

export default function AddClassForm({ onDone, autoFocus = false }: AddClassFormProps) {
  const addClass = useGameStore((theState) => theState.addClass)
  const [theName, setTheName] = useState('')
  const [theNames, setTheNames] = useState('')
  const theNameId = useId()
  const theListId = useId()
  const theCount = parseNames(theNames).length

  let theCountLabel = 'No names yet'
  if (theCount === 1) {
    theCountLabel = '1 student'
  } else if (theCount > 1) {
    theCountLabel = String(theCount) + ' students'
  }

  function handleSubmit(theEvent: FormEvent<HTMLFormElement>) {
    theEvent.preventDefault()
    addClass(theName, theNames)
    setTheName('')
    setTheNames('')
    if (onDone !== undefined) {
      onDone()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={theNameId} className="label">
        Class name
      </label>
      <input
        id={theNameId}
        value={theName}
        onChange={(theEvent) => setTheName(theEvent.target.value)}
        placeholder="CS period 3"
        autoFocus={autoFocus}
        maxLength={40}
        className="h-12 border-b-4 border-surface-3 bg-surface-2 px-3 text-lg font-semibold text-text placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <div className="mt-2 flex items-baseline justify-between">
        <label htmlFor={theListId} className="label">
          Paste names, one per line
        </label>
        <span className="label tabular" aria-live="polite">
          {theCountLabel}
        </span>
      </div>
      <textarea
        id={theListId}
        value={theNames}
        onChange={(theEvent) => setTheNames(theEvent.target.value)}
        rows={7}
        placeholder={'Aryav Das\nMaya Chen\nJordan Brooks'}
        className="scroll-area resize-none border-b-4 border-surface-3 bg-surface-2 px-3 py-2 text-base leading-relaxed text-text placeholder:text-faint focus:border-gold focus:outline-none"
      />
      <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={theName.trim().length === 0 && theCount === 0}>
        Add class
      </Button>
    </form>
  )
}
