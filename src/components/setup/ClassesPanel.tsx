import { useState } from 'react'
import { findClass, useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import AddClassForm from './AddClassForm'
import ClassRosterColumn from './ClassRosterColumn'
import ClassTeamsColumn from './ClassTeamsColumn'
import DeleteClassModal from './DeleteClassModal'
import { countPresent } from './setupHelpers'

export default function ClassesPanel() {
  const theClasses = useGameStore((theState) => theState.classes)
  const theActiveClassId = useGameStore((theState) => theState.activeClassId)
  const setActiveClass = useGameStore((theState) => theState.setActiveClass)
  const renameClass = useGameStore((theState) => theState.renameClass)
  const deleteClass = useGameStore((theState) => theState.deleteClass)
  const [theAddOpen, setTheAddOpen] = useState(false)
  const [theDeleteOpen, setTheDeleteOpen] = useState(false)

  if (theClasses.length === 0) {
    return (
      <div className="scroll-area grid h-full min-h-0 content-start gap-6 xl:content-center xl:gap-10 xl:grid-cols-[1fr_1.1fr]">
        <div className="border-l-8 border-crimson pl-6">
          <h3 className="display text-5xl xl:text-7xl">Add your first class</h3>
          <p className="mt-4 max-w-[34ch] text-lg text-muted">Track who has guessed, mark absences, and keep lifetime stats.</p>
        </div>
        <AddClassForm />
      </div>
    )
  }

  const theClass = findClass(theClasses, theActiveClassId)

  const theChips = []
  for (let n = 0; n < theClasses.length; n++) {
    const theItem = theClasses[n]
    let isActive = false
    if (theClass !== null && theItem.id === theClass.id) {
      isActive = true
    }
    let theTone = 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-text'
    if (isActive) {
      theTone = 'bg-crimson text-white'
    }
    theChips.push(
      <li key={theItem.id} className="shrink-0">
        <button type="button" onClick={() => setActiveClass(theItem.id)} aria-pressed={isActive} className={'flex h-11 items-center gap-3 px-4 transition-colors ' + theTone}>
          <span className="max-w-[24ch] truncate font-display text-xl font-extrabold">{theItem.name}</span>
          <span className="tabular text-sm font-semibold opacity-80">
            {countPresent(theItem)}/{theItem.students.length}
          </span>
        </button>
      </li>,
    )
  }

  let theDetail = (
    <div className="flex flex-1 flex-col justify-center">
      <p className="display text-5xl">Pick a class</p>
      <p className="mt-2 text-muted">Take attendance, then split into teams.</p>
    </div>
  )
  if (theClass !== null) {
    const theActive = theClass
    theDetail = (
      <>
        <div className="flex items-center gap-3 pb-4">
          <input
            value={theActive.name}
            onChange={(theEvent) => renameClass(theActive.id, theEvent.target.value)}
            aria-label="Class name"
            maxLength={40}
            className="display h-14 min-w-0 flex-1 border-b-4 border-transparent bg-transparent text-4xl text-text [word-spacing:0.1em] xl:text-5xl 2xl:h-16 2xl:text-6xl hover:border-surface-3 focus:border-gold focus:outline-none"
          />
          <Button variant="danger" size="sm" onClick={() => setTheDeleteOpen(true)}>
            Delete class
          </Button>
        </div>
        <div className="grid min-h-0 flex-1 gap-8 md:grid-cols-2">
          <ClassRosterColumn classRoom={theActive} />
          <ClassTeamsColumn key={theActive.id} classRoom={theActive} />
        </div>
        <DeleteClassModal
          open={theDeleteOpen}
          onOpenChange={setTheDeleteOpen}
          classRoom={theActive}
          onConfirm={() => {
            deleteClass(theActive.id)
            setTheDeleteOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 pb-4">
        <ul className="scroll-area flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden" aria-label="Saved classes">
          {theChips}
        </ul>
        <Button variant="secondary" size="md" className="shrink-0" onClick={() => setTheAddOpen(true)}>
          Add class
        </Button>
      </div>
      {theDetail}
      <Modal open={theAddOpen} onOpenChange={setTheAddOpen} title="Add a class" width="max-w-lg">
        <AddClassForm autoFocus onDone={() => setTheAddOpen(false)} />
      </Modal>
    </div>
  )
}
