import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'

const MIN_WORD_PX = 120
const MEASURE_PX = 100
const WIDTH_SHARE = 0.85
const VIEWPORT_HEIGHT_CAP = 0.3

// Measuring a hidden copy at a known size gives an exact fit for any word and any font width, no per-letter guessing.
export default function WordDisplay({ word }: { word: string }) {
  const theBoxRef = useRef<HTMLDivElement>(null)
  const theMeasureRef = useRef<HTMLSpanElement>(null)
  const [theSize, setTheSize] = useState(MIN_WORD_PX)

  useLayoutEffect(() => {
    const theBox = theBoxRef.current
    const theMeasure = theMeasureRef.current
    if (theBox === null || theMeasure === null) {
      return
    }
    function fit(theBoxEl: HTMLDivElement, theMeasureEl: HTMLSpanElement) {
      const theTextWidth = theMeasureEl.offsetWidth
      if (theTextWidth === 0) {
        return
      }
      let theNext = (theBoxEl.clientWidth * WIDTH_SHARE * MEASURE_PX) / theTextWidth
      const theHeightCap = Math.min(window.innerHeight * VIEWPORT_HEIGHT_CAP, theBoxEl.clientHeight * 0.9)
      theNext = Math.min(theNext, theHeightCap)
      theNext = Math.max(MIN_WORD_PX, theNext)
      setTheSize(Math.floor(theNext))
    }
    fit(theBox, theMeasure)
    const theObserver = new ResizeObserver(() => fit(theBox, theMeasure))
    theObserver.observe(theBox)
    let theAlive = true
    document.fonts.ready.then(() => {
      if (theAlive) {
        fit(theBox, theMeasure)
      }
    })
    return () => {
      theAlive = false
      theObserver.disconnect()
    }
  }, [word])

  const theTypeClass = 'font-display font-black lowercase leading-[0.9] whitespace-nowrap'
  return (
    <div ref={theBoxRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <span ref={theMeasureRef} aria-hidden="true" className={'pointer-events-none invisible absolute top-0 left-0 ' + theTypeClass} style={{ fontSize: MEASURE_PX }}>
        {word}
      </span>
      <motion.span
        key={word}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        className={'block pb-[0.1em] text-text ' + theTypeClass}
        style={{ fontSize: theSize }}
        aria-live="polite"
      >
        {word}
      </motion.span>
    </div>
  )
}
