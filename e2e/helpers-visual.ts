import { expect, type Page, type TestInfo } from '@playwright/test'
import { waitForPhase } from './helpers'

export type Box = { x: number; y: number; width: number; height: number }

export type Overlap = { a: string; b: string }

// Screens land in a per-project folder so the 1920 and 1000 shots of the same state sit side by side.
export async function saveScreen(thePage: Page, theInfo: TestInfo, theName: string): Promise<void> {
  await thePage.screenshot({ path: 'e2e/__screens__/' + theInfo.project.name + '/' + theName + '.png', fullPage: true })
}

export async function expectNoHorizontalOverflow(thePage: Page): Promise<void> {
  const theSizes = await thePage.evaluate(() => {
    const theRoot = document.scrollingElement
    return { scrollW: theRoot ? theRoot.scrollWidth : 0, innerW: window.innerWidth }
  })
  expect(theSizes.scrollW, 'page scrolls sideways').toBeLessThanOrEqual(theSizes.innerW + 1)
}

// Only buttons a user could actually hit count: ones hidden behind a modal or a result band are skipped.
export async function findOverlappingButtons(thePage: Page): Promise<Overlap[]> {
  return thePage.evaluate(() => {
    function describe(theEl: Element): string {
      const theName = theEl.getAttribute('aria-label') ?? (theEl.textContent ?? '').trim()
      return theEl.tagName.toLowerCase() + '[' + theName.slice(0, 40) + ']'
    }
    const theAll = document.querySelectorAll('button, a[href], [role="tab"], input, textarea, select')
    const theHits: { el: Element; r: DOMRect }[] = []
    for (let n = 0; n < theAll.length; n++) {
      const theEl = theAll[n]
      const theRect = theEl.getBoundingClientRect()
      if (theRect.width < 1 || theRect.height < 1) {
        continue
      }
      const theStyle = getComputedStyle(theEl)
      if (theStyle.visibility === 'hidden' || theStyle.display === 'none') {
        continue
      }
      if (theEl.closest('[aria-hidden="true"], [inert]') !== null) {
        continue
      }
      const theCx = Math.min(window.innerWidth - 1, Math.max(0, theRect.left + theRect.width / 2))
      const theCy = Math.min(window.innerHeight - 1, Math.max(0, theRect.top + theRect.height / 2))
      const theTop = document.elementFromPoint(theCx, theCy)
      if (theTop === null || (theTop !== theEl && !theEl.contains(theTop) && !theTop.contains(theEl))) {
        continue
      }
      theHits.push({ el: theEl, r: theRect })
    }
    const theOut: { a: string; b: string }[] = []
    for (let n = 0; n < theHits.length; n++) {
      for (let i = n + 1; i < theHits.length; i++) {
        const theA = theHits[n]
        const theB = theHits[i]
        if (theA.el.contains(theB.el) || theB.el.contains(theA.el)) {
          continue
        }
        const theW = Math.min(theA.r.right, theB.r.right) - Math.max(theA.r.left, theB.r.left)
        const theH = Math.min(theA.r.bottom, theB.r.bottom) - Math.max(theA.r.top, theB.r.top)
        if (theW > 1 && theH > 1) {
          theOut.push({ a: describe(theA.el), b: describe(theB.el) })
        }
      }
    }
    return theOut
  })
}

// Leaf text elements inside one container must not sit on top of each other.
export async function findOverlappingText(thePage: Page, theSelector: string): Promise<Overlap[]> {
  return thePage.evaluate((theSel) => {
    const theRoot = document.querySelector(theSel)
    if (theRoot === null) {
      return [{ a: 'missing', b: theSel }]
    }
    const theAll = theRoot.querySelectorAll('*')
    const theLeaves: { el: Element; r: DOMRect; text: string }[] = []
    for (let n = 0; n < theAll.length; n++) {
      const theEl = theAll[n]
      let theOwn = ''
      for (let i = 0; i < theEl.childNodes.length; i++) {
        if (theEl.childNodes[i].nodeType === Node.TEXT_NODE) {
          theOwn = theOwn + (theEl.childNodes[i].textContent ?? '')
        }
      }
      if (theOwn.trim().length === 0 || theEl.closest('[aria-hidden="true"]') !== null) {
        continue
      }
      const theRange = document.createRange()
      theRange.selectNodeContents(theEl)
      const theRect = theRange.getBoundingClientRect()
      if (theRect.width < 1 || theRect.height < 1) {
        continue
      }
      // A range box covers the font's full ascent and descent; trimming it toward the glyphs avoids false hits
      // between tightly stacked lines that do not visibly touch.
      const theTrim = theRect.height * 0.2
      const theGlyphs = new DOMRect(theRect.left, theRect.top + theTrim, theRect.width, theRect.height - theTrim * 2)
      theLeaves.push({ el: theEl, r: theGlyphs, text: theOwn.trim().slice(0, 30) })
    }
    const theOut: { a: string; b: string }[] = []
    for (let n = 0; n < theLeaves.length; n++) {
      for (let i = n + 1; i < theLeaves.length; i++) {
        const theA = theLeaves[n]
        const theB = theLeaves[i]
        if (theA.el.contains(theB.el) || theB.el.contains(theA.el)) {
          continue
        }
        const theW = Math.min(theA.r.right, theB.r.right) - Math.max(theA.r.left, theB.r.left)
        const theH = Math.min(theA.r.bottom, theB.r.bottom) - Math.max(theA.r.top, theB.r.top)
        if (theW > 2 && theH > 2) {
          theOut.push({ a: theA.text, b: theB.text })
        }
      }
    }
    return theOut
  }, theSelector)
}

// A display heading that is wider than its box is cut off, unless it opted into an ellipsis with truncate.
export async function findClippedDisplayText(thePage: Page): Promise<string[]> {
  return thePage.evaluate(() => {
    const theAll = document.querySelectorAll('.display')
    const theOut: string[] = []
    for (let n = 0; n < theAll.length; n++) {
      const theEl = theAll[n] as HTMLElement
      if (theEl.classList.contains('truncate') || theEl.closest('[aria-hidden="true"]') !== null) {
        continue
      }
      if (theEl.clientWidth === 0 || getComputedStyle(theEl).display === 'inline') {
        continue
      }
      if (theEl.scrollWidth > theEl.clientWidth + 1) {
        theOut.push((theEl.textContent ?? '').trim().slice(0, 40) + ' ' + String(theEl.scrollWidth) + '>' + String(theEl.clientWidth))
      }
    }
    return theOut
  })
}

export async function findKeycapOverlaps(thePage: Page): Promise<string[]> {
  return thePage.evaluate(() => {
    const theCaps = document.querySelectorAll('button kbd.keycap')
    const theOut: string[] = []
    for (let n = 0; n < theCaps.length; n++) {
      const theCap = theCaps[n]
      const theCapRect = theCap.getBoundingClientRect()
      if (theCapRect.width < 1 || getComputedStyle(theCap).display === 'none') {
        continue
      }
      const theButton = theCap.closest('button')
      if (theButton === null) {
        continue
      }
      const theButtonRect = theButton.getBoundingClientRect()
      if (theCapRect.right > theButtonRect.right + 1 || theCapRect.left < theButtonRect.left - 1) {
        theOut.push('cap ' + (theCap.textContent ?? '') + ' spills out of its button')
      }
      const theSpans = theButton.querySelectorAll(':scope > span')
      for (let i = 0; i < theSpans.length; i++) {
        const theRange = document.createRange()
        theRange.selectNodeContents(theSpans[i])
        const theLabel = theRange.getBoundingClientRect()
        const theW = Math.min(theLabel.right, theCapRect.right) - Math.max(theLabel.left, theCapRect.left)
        const theH = Math.min(theLabel.bottom, theCapRect.bottom) - Math.max(theLabel.top, theCapRect.top)
        if (theLabel.width > 0 && theW > 0 && theH > 0) {
          theOut.push('cap ' + (theCap.textContent ?? '') + ' overlaps ' + (theSpans[i].textContent ?? ''))
        }
      }
    }
    return theOut
  })
}

// Every corner of the digit glyph box must sit inside the ring's inner edge.
export async function timerDigitsInsideRing(thePage: Page): Promise<{ ok: boolean; detail: string }> {
  return thePage.evaluate(() => {
    const theTimer = document.querySelector('[role="timer"]')
    if (theTimer === null) {
      return { ok: false, detail: 'no timer' }
    }
    const theDigits = theTimer.querySelector('span.display')
    if (theDigits === null) {
      return { ok: false, detail: 'no digits' }
    }
    const theRing = theTimer.getBoundingClientRect()
    const theRange = document.createRange()
    theRange.selectNodeContents(theDigits)
    const theBox = theRange.getBoundingClientRect()
    const theCx = theRing.left + theRing.width / 2
    const theCy = theRing.top + theRing.height / 2
    const theInner = theRing.width / 2 - 9
    const theCorners = [
      [theBox.left, theBox.top],
      [theBox.right, theBox.top],
      [theBox.left, theBox.bottom],
      [theBox.right, theBox.bottom],
    ]
    let theWorst = 0
    for (let n = 0; n < theCorners.length; n++) {
      const theDx = theCorners[n][0] - theCx
      const theDy = theCorners[n][1] - theCy
      theWorst = Math.max(theWorst, Math.sqrt(theDx * theDx + theDy * theDy))
    }
    return { ok: theWorst <= theInner, detail: 'corner ' + theWorst.toFixed(1) + ' vs inner radius ' + theInner.toFixed(1) }
  })
}

export async function expectCleanLayout(thePage: Page, theNoScroll: boolean): Promise<void> {
  await expectNoHorizontalOverflow(thePage)
  if (theNoScroll) {
    const theSizes = await thePage.evaluate(() => ({
      scroll: document.scrollingElement ? document.scrollingElement.scrollHeight : 0,
      inner: window.innerHeight,
      mainScroll: (() => {
        const theMain = document.querySelector('main')
        if (theMain === null) {
          return 0
        }
        return theMain.scrollHeight - theMain.clientHeight
      })(),
    }))
    expect(theSizes.scroll, 'page scrolls vertically').toBeLessThanOrEqual(theSizes.inner + 1)
    expect(theSizes.mainScroll, 'main area scrolls vertically').toBeLessThanOrEqual(1)
  }
  expect(await findOverlappingButtons(thePage), 'overlapping interactive elements').toEqual([])
  expect(await findClippedDisplayText(thePage), 'clipped display text').toEqual([])
  expect(await findKeycapOverlaps(thePage), 'key caps over labels').toEqual([])
}

// Names two players per team so the swap button and guesser picker appear.
export async function startGameWithPlayers(thePage: Page): Promise<void> {
  await thePage.goto('/#/')
  const theFirst = thePage.getByRole('textbox', { name: 'Players on Team 1' })
  await expect(theFirst).toBeVisible()
  await theFirst.fill('Ava\nBen')
  const theSecond = thePage.getByRole('textbox', { name: 'Players on Team 2' })
  await theSecond.fill('Cy\nDee')
  await thePage.getByRole('heading').first().click({ force: true }).catch(() => undefined)
  await thePage.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await thePage.getByRole('button', { name: /start game/i }).first().click()
  await waitForPhase(thePage, 'teamup')
  await expect(thePage.getByRole('button', { name: /start turn|start now/i }).first()).toBeVisible()
}

export async function goLiveFromTeamUp(thePage: Page): Promise<void> {
  await expect(thePage.getByRole('button', { name: /start turn|start now/i }).first()).toBeVisible()
  await thePage.keyboard.press('Space')
  await waitForPhase(thePage, 'live')
}
