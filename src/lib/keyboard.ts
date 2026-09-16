export function isTypingTarget(theTarget: EventTarget | null): boolean {
  if (!(theTarget instanceof HTMLElement)) {
    return false
  }
  const theTag = theTarget.tagName
  if (theTag === 'INPUT' || theTag === 'TEXTAREA' || theTag === 'SELECT') {
    return true
  }
  if (theTarget.isContentEditable) {
    return true
  }
  return theTarget.closest('[role="listbox"], [role="combobox"], [role="menu"]') !== null
}

export function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]') !== null
}

export function keyName(theEvent: KeyboardEvent): string {
  if (theEvent.key === ' ') {
    return 'Space'
  }
  if (theEvent.key.length === 1) {
    return theEvent.key.toLowerCase()
  }
  return theEvent.key
}

export function isActivatable(theTarget: EventTarget | null): boolean {
  if (!(theTarget instanceof HTMLElement)) {
    return false
  }
  return theTarget.closest('button, a[href], [role="tab"], [role="button"], [role="switch"], [role="checkbox"], summary') !== null
}
