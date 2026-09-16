import type { WordEntry } from '../src/engine/wordTypes.ts'

export type CountTable = { rows: string[]; columns: string[]; cells: Record<string, Record<string, number>> }

export function syllableBucket(theSyllables: number): string {
  if (theSyllables >= 5) {
    return '5+'
  }
  return String(theSyllables)
}

function padRight(theText: string, theWidth: number): string {
  let theResult = theText
  while (theResult.length < theWidth) {
    theResult = theResult + ' '
  }
  return theResult
}

function padLeft(theText: string, theWidth: number): string {
  let theResult = theText
  while (theResult.length < theWidth) {
    theResult = ' ' + theResult
  }
  return theResult
}

export function buildCountTable(
  theEntries: WordEntry[],
  theRows: string[],
  theColumns: string[],
  theRowOf: (theEntry: WordEntry) => string,
  theColumnOf: (theEntry: WordEntry) => string,
): CountTable {
  const theCells: Record<string, Record<string, number>> = {}
  const theAllRows: string[] = []
  for (let n = 0; n < theRows.length; n++) {
    theAllRows.push(theRows[n])
  }
  theAllRows.push('all')
  for (let n = 0; n < theAllRows.length; n++) {
    const theRow: Record<string, number> = {}
    for (let i = 0; i < theColumns.length; i++) {
      theRow[theColumns[i]] = 0
    }
    theCells[theAllRows[n]] = theRow
  }
  for (let n = 0; n < theEntries.length; n++) {
    const theColumn = theColumnOf(theEntries[n])
    theCells[theRowOf(theEntries[n])][theColumn]++
    theCells['all'][theColumn]++
  }
  return { rows: theAllRows, columns: theColumns, cells: theCells }
}

export function printCountTable(theTitle: string, theTable: CountTable): void {
  const theLabelWidth = 10
  const theCellWidth = 8
  let theHeader = padRight('', theLabelWidth)
  for (let n = 0; n < theTable.columns.length; n++) {
    theHeader = theHeader + padLeft(theTable.columns[n], theCellWidth)
  }
  theHeader = theHeader + padLeft('total', theCellWidth)
  console.log('')
  console.log(theTitle)
  console.log(theHeader)
  for (let n = 0; n < theTable.rows.length; n++) {
    const theRow = theTable.cells[theTable.rows[n]]
    let theLine = padRight(theTable.rows[n], theLabelWidth)
    let theTotal = 0
    for (let i = 0; i < theTable.columns.length; i++) {
      theLine = theLine + padLeft(String(theRow[theTable.columns[i]]), theCellWidth)
      theTotal = theTotal + theRow[theTable.columns[i]]
    }
    theLine = theLine + padLeft(String(theTotal), theCellWidth)
    console.log(theLine)
  }
}

export function printList(theTitle: string, theItems: string[]): void {
  if (theItems.length === 0) {
    return
  }
  console.log('')
  console.log(`${theTitle} (${theItems.length}):`)
  for (let n = 0; n < theItems.length; n++) {
    console.log(`  ${theItems[n]}`)
  }
}

// Printed as wrapped lines so a sample of 60 words fits on one screen.
export function printWrapped(theTitle: string, theWords: string[]): void {
  console.log('')
  console.log(theTitle)
  let theLine = ' '
  for (let n = 0; n < theWords.length; n++) {
    if (theLine.length + theWords[n].length > 90) {
      console.log(theLine)
      theLine = ' '
    }
    theLine = theLine + ' ' + theWords[n]
  }
  if (theLine.trim() !== '') {
    console.log(theLine)
  }
}

// Partial Fisher-Yates so the sample has no repeats.
export function randomSample(theWords: string[], num: number): string[] {
  const theCopy: string[] = []
  for (let n = 0; n < theWords.length; n++) {
    theCopy.push(theWords[n])
  }
  const theCount = Math.min(num, theCopy.length)
  for (let n = 0; n < theCount; n++) {
    const theSwap = n + Math.floor(Math.random() * (theCopy.length - n))
    const theHeld = theCopy[n]
    theCopy[n] = theCopy[theSwap]
    theCopy[theSwap] = theHeld
  }
  return theCopy.slice(0, theCount)
}

export function printReasonCounts(theReasons: Map<string, number>): void {
  const theNames = Array.from(theReasons.keys())
  theNames.sort()
  console.log('')
  console.log('Candidates dropped, by reason')
  for (let n = 0; n < theNames.length; n++) {
    console.log(`  ${padRight(theNames[n], 34)}${padLeft(String(theReasons.get(theNames[n])), 7)}`)
  }
}
