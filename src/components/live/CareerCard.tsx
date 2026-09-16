import { useEffect, useRef, useState } from 'react'
import { liveCareer } from '../../engine/career'
import { CORRECT_CARD_MS } from '../../engine/defaults'
import { useGameClass } from '../../hooks/useGameView'
import { useGameStore } from '../../store/useGameStore'

type CardText = {
  id: string
  name: string
  seconds: string
  correct: number
}

// Watching the history row instead of the key press means the projector window shows the same card as the teacher.
export default function CareerCard() {
  const theGame = useGameStore((theState) => theState.game)
  const theClass = useGameClass()
  const theHistory = theGame.history
  let theLastId = ''
  if (theHistory.length > 0) {
    theLastId = theHistory[theHistory.length - 1].id
  }
  const theSeenRef = useRef(theLastId)
  const [theCard, setTheCard] = useState<CardText | null>(null)

  useEffect(() => {
    if (theLastId === theSeenRef.current) {
      return
    }
    theSeenRef.current = theLastId
    const theRow = theHistory[theHistory.length - 1]
    if (theRow === undefined || theRow.outcome !== 'correct' || theGame.mode !== 'class' || theClass === null) {
      return
    }
    if (Date.now() - theRow.at > CORRECT_CARD_MS) {
      return
    }
    let theStudent = null
    for (let n = 0; n < theClass.students.length; n++) {
      if (theClass.students[n].id === theRow.guesserId) {
        theStudent = theClass.students[n]
      }
    }
    if (theStudent === null) {
      return
    }
    const theCareer = liveCareer(theStudent, theGame)
    setTheCard({ id: theRow.id, name: theStudent.name, seconds: (theRow.elapsedMs / 1000).toFixed(1), correct: theCareer.correct })
  }, [theLastId, theHistory, theGame, theClass])

  useEffect(() => {
    if (theCard === null) {
      return
    }
    const theTimer = window.setTimeout(() => setTheCard(null), CORRECT_CARD_MS)
    return () => window.clearTimeout(theTimer)
  }, [theCard])

  if (theCard === null) {
    return null
  }
  return (
    <div key={theCard.id} className="border-l-8 border-good bg-surface-2 px-6 py-2 text-[clamp(22px,3vh,34px)] font-extrabold" role="status">
      {theCard.name}, <span className="tabular text-good">{theCard.seconds} s</span>. Career: <span className="tabular text-gold">{theCard.correct}</span> correct.
    </div>
  )
}
