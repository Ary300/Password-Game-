import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ClassRoom } from '../../engine/types'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import StudentTile from './StudentTile'
import { countPresent } from './setupHelpers'

export default function ClassRosterColumn({ classRoom }: { classRoom: ClassRoom }) {
  const toggleAbsent = useGameStore((theState) => theState.toggleAbsent)
  const setAllPresent = useGameStore((theState) => theState.setAllPresent)
  const removeStudent = useGameStore((theState) => theState.removeStudent)
  const addStudents = useGameStore((theState) => theState.addStudents)
  const [theNewNames, setTheNewNames] = useState('')

  const thePresent = countPresent(classRoom)
  const theTiles = []
  for (let n = 0; n < classRoom.students.length; n++) {
    const theStudent = classRoom.students[n]
    theTiles.push(
      <StudentTile
        key={theStudent.id}
        student={theStudent}
        onToggleAbsent={() => toggleAbsent(classRoom.id, theStudent.id)}
        onRemove={() => removeStudent(classRoom.id, theStudent.id)}
      />,
    )
  }

  function markEveryoneHere() {
    setAllPresent(classRoom.id)
  }

  function handleAdd(theEvent: FormEvent<HTMLFormElement>) {
    theEvent.preventDefault()
    if (theNewNames.trim().length === 0) {
      return
    }
    addStudents(classRoom.id, theNewNames)
    setTheNewNames('')
  }

  let theRoster = <p className="py-6 text-muted">No students yet. Add names below.</p>
  if (theTiles.length > 0) {
    theRoster = <ul className="grid gap-x-5 2xl:grid-cols-2">{theTiles}</ul>
  }

  let theMarkAll = null
  if (thePresent < classRoom.students.length) {
    theMarkAll = (
      <Button variant="ghost" size="sm" className="shrink-0" onClick={markEveryoneHere}>
        Mark all here
      </Button>
    )
  }

  return (
    <section className="flex min-h-0 flex-col" aria-labelledby="roster-title">
      <div className="flex items-end justify-between gap-3">
        <h3 id="roster-title" className="display text-3xl whitespace-nowrap [word-spacing:0.1em]">
          Here today
        </h3>
        <p className="display tabular text-5xl leading-none whitespace-nowrap">
          {thePresent}
          <span className="text-3xl text-faint">/{classRoom.students.length}</span>
        </p>
      </div>
      <div className="flex min-h-9 items-center justify-between gap-2 border-b-4 border-surface-3 pb-1">
        <p className="label truncate">Tap a name to mark absent</p>
        {theMarkAll}
      </div>
      <div className="scroll-area min-h-0 flex-1 pr-1">{theRoster}</div>
      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <input
          value={theNewNames}
          onChange={(theEvent) => setTheNewNames(theEvent.target.value)}
          placeholder="Add students, comma separated"
          aria-label="Add students to this class"
          className="h-11 min-w-0 flex-1 border-b-4 border-surface-3 bg-surface-2 px-3 text-base text-text placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <Button type="submit" variant="secondary" size="md" disabled={theNewNames.trim().length === 0}>
          Add
        </Button>
      </form>
    </section>
  )
}
