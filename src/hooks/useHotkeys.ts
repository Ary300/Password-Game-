import { useEffect, useRef } from 'react'
import { isDialogOpen, isTypingTarget, keyName } from '../lib/keyboard'

export type HotkeyMap = Record<string, (theEvent: KeyboardEvent) => void>

// Keys never fire while typing in a field or while a dialog is open, so a teacher renaming a team cannot score by accident.
export function useHotkeys(theMap: HotkeyMap, theEnabled: boolean): void {
  const theRef = useRef(theMap)
  theRef.current = theMap
  useEffect(() => {
    if (!theEnabled) {
      return
    }
    function onKey(theEvent: KeyboardEvent) {
      if (theEvent.metaKey || theEvent.ctrlKey || theEvent.altKey || theEvent.repeat) {
        return
      }
      if (isTypingTarget(theEvent.target) || isDialogOpen()) {
        return
      }
      const theHandler = theRef.current[keyName(theEvent)]
      if (theHandler === undefined) {
        return
      }
      theEvent.preventDefault()
      theHandler(theEvent)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [theEnabled])
}
