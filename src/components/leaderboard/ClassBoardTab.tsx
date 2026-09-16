import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameTotals } from '../../engine/career'
import { computeClassStandings } from '../../engine/classBoard'
import { useGameStore } from '../../store/useGameStore'
import Button from '../ui/Button'
import EmptyPanel from './EmptyPanel'
import { CLASS_GRID } from './grids'

export default function ClassBoardTab() {
  const theNavigate = useNavigate()
  const theClasses = useGameStore((theState) => theState.classes)
  const theGame = useGameStore((theState) => theState.game)

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
    const thePlayed = theRow.turns > 0
    let theShare = 0
    if (theBest > 0) {
      theShare = (theRow.average / theBest) * 100
    }
    let theBand = 'bg-surface'
    if (n % 2 === 1) {
      theBand = 'bg-surface-2'
    }
    let theRule = 'border-surface-3'
    let theRankTone = 'text-text'
    let theAverageTone = 'text-gold'
    if (theRow.rank === 1 && thePlayed) {
      theRule = 'border-gold'
      theRankTone = 'text-gold'
    }
    if (!thePlayed) {
      theAverageTone = 'text-faint'
    }
    let theLiveLabel = null
    if (theRow.classId === theLiveClassId) {
      theLiveLabel = <span className="shrink-0 bg-crimson px-2 py-0.5 text-sm font-bold text-white">Playing now</span>
    }
    theRows.push(
      <motion.li key={theRow.classId} layout className={'border-l-8 py-3 pr-5 pl-3 ' + theBand + ' ' + theRule + ' ' + CLASS_GRID}>
        <span className={'display tabular text-center text-7xl ' + theRankTone}>{theRow.rank}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <span className="display truncate pb-1 text-[clamp(2.25rem,4.5vh,3rem)]">{theRow.name}</span>
            {theLiveLabel}
          </div>
          <div className="mt-2 h-2.5 bg-bg" aria-hidden="true">
            <motion.div className="h-full bg-crimson" initial={{ width: 0 }} animate={{ width: String(theShare) + '%' }} transition={{ type: 'spring', stiffness: 160, damping: 26 }} />
          </div>
        </div>
        <span className={'display tabular text-right text-6xl ' + theAverageTone}>{theRow.average.toFixed(2)}</span>
        <span className="display tabular text-right text-4xl">{theRow.games}</span>
        <span className="display tabular text-right text-4xl text-muted">{theRow.turns}</span>
        <span className="display tabular text-right text-4xl text-muted">{theRow.correct}</span>
      </motion.li>,
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={'label border-l-8 border-transparent pr-5 pb-2 pl-3 ' + CLASS_GRID}>
        <span className="text-center">Rank</span>
        <span>Class</span>
        <span className="text-right">Correct per turn</span>
        <span className="text-right">Games</span>
        <span className="text-right">Turns</span>
        <span className="text-right">Correct</span>
      </div>
      <ol className="scroll-area flex min-h-0 flex-1 flex-col" aria-label="Class standings">
        {theRows}
      </ol>
    </div>
  )
}
