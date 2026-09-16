import { useEffect, useRef } from 'react'
import { isActivatable, isDialogOpen, isTypingTarget, keyName } from '../lib/keyboard'

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
      if (theEvent.defaultPrevented || isTypingTarget(theEvent.target) || isDialogOpen()) {
        return
      }
      // A focused button already acts on Enter or Space, so the hotkey would fire a second, different action.
      if ((theEvent.key === 'Enter' || theEvent.key === ' ') && isActivatable(theEvent.target)) {
        return
      }
      const theHandler = theRef.current[keyName(theEvent)]
      if (theHandler === undefined) {
        return
      }
      theEvent.preventDefault()
      theHandler(theEvent)
    }
    // Capture phase runs before Radix closes a dialog on Escape, so the dialog still counts as open here.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [theEnabled])
}
