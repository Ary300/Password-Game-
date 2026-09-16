import { useEffect, useState } from 'react'

// requestAnimationFrame keeps the ring smooth; the clock value itself always comes from Date.now so it never drifts.
export function useNow(theActive: boolean): number {
  const [theNow, setTheNow] = useState(() => Date.now())
  useEffect(() => {
    if (!theActive) {
      setTheNow(Date.now())
      return
    }
    let theFrame = 0
    function loop() {
      setTheNow(Date.now())
      theFrame = requestAnimationFrame(loop)
    }
    theFrame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(theFrame)
  }, [theActive])
  return theNow
}
