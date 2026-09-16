import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { gameTotals } from '../../engine/career'
import { computeClassStandings, topGuessers } from '../../engine/classBoard'
import { findClass, useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import ClassBoardRow from './ClassBoardRow'
import EmptyPanel from './EmptyPanel'
import { CLASS_GRID } from './grids'
import ResetClassModal from './ResetClassModal'

const TOP_GUESSER_COUNT = 3

export default function ClassBoardTab() {
  const theNavigate = useNavigate()
  const theClasses = useGameStore((theState) => theState.classes)
  const theGame = useGameStore((theState) => theState.game)
  const resetClassBoard = useGameStore((theState) => theState.resetClassBoard)
  const [theResetId, setTheResetId] = useState<string | null>(null)

  const theStandings = useMemo(() => {
    let theLive = null
    // An unsaved class game counts right away so the board is honest mid-period.
    if (theGame.classId !== null && !theGame.committed) {
      theLive = { classId: theGame.classId, totals: gameTotals(theGame) }
    }
    return computeClassStandings(theClasses, theLive)
  }, [theClasses, theGame])

  if (theStandings.length === 0) {
    return (
      <EmptyPanel
        title="No classes yet"
        body="Save a class on the Setup screen to compare periods."
        action={
          <Button variant="primary" size="lg" onClick={() => theNavigate('/')}>
            Go to Setup
          </Button>
        }
      />
    )
  }

  let theBest = 0
  for (let n = 0; n < theStandings.length; n++) {
    if (theStandings[n].average > theBest) {
      theBest = theStandings[n].average
    }
  }

  let theLiveClassId = ''
  if (theGame.classId !== null && !theGame.committed && theGame.turnsLog.length > 0) {
    theLiveClassId = theGame.classId
  }

  const theRows = []
  for (let n = 0; n < theStandings.length; n++) {
    const theRow = theStandings[n]
    let theShare = 0
    if (theBest > 0) {
      theShare = (theRow.average / theBest) * 100
    }
    let theTop: ReturnType<typeof topGuessers> = []
    const theClass = findClass(theClasses, theRow.classId)
    if (theClass !== null) {
      theTop = topGuessers(theClass, theGame, TOP_GUESSER_COUNT)
    }
    theRows.push(
      <ClassBoardRow
        key={theRow.classId}
        standing={theRow}
        share={theShare}
        striped={n % 2 === 1}
        playingNow={theRow.classId === theLiveClassId}
        topGuessers={theTop}
        onReset={() => setTheResetId(theRow.classId)}
      />,
    )
  }

  let theModal = null
  const theResetClass = findClass(theClasses, theResetId)
  if (theResetClass !== null) {
    theModal = (
      <ResetClassModal
        key={theResetClass.id}
        classTitle={theResetClass.name}
        playingNow={theResetClass.id === theLiveClassId}
        onCancel={() => setTheResetId(null)}
        onConfirm={(theCareersToo) => {
          resetClassBoard(theResetClass.id, theCareersToo)
          setTheResetId(null)
          toast.success(theResetClass.name + ' reset')
        }}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={'label border-l-8 border-transparent pr-3 pb-2 pl-3 ' + CLASS_GRID}>
        <span className="text-center">Rank</span>
        <span>Class</span>
        <span className="text-right">Correct per turn</span>
        <span className="text-right">Games</span>
        <span className="text-right">Turns</span>
        <span className="text-right">Correct</span>
        <span className="sr-only">Reset</span>
      </div>
      <ol className="scroll-area flex min-h-0 flex-1 flex-col" aria-label="Class standings">
        {theRows}
      </ol>
      {theModal}
    </div>
  )
}
