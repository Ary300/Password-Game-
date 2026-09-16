import { useEffect } from 'react'
import { COUNTDOWN_MS, RED_AT_SECONDS, RESULT_BANNER_MS } from '../engine/defaults'
import { remainingMs, secondsLeftFromMs } from '../engine/timer'
import { burstConfetti, podiumConfetti } from '../lib/confetti'
import {
  playBuzzer,
  playChime,
  playCountdownBeep,
  playFanfare,
  playFinalTick,
  playGoBeep,
  playSkip,
  playTick,
  setMuted,
} from '../lib/sound'
import { currentTeamOf, turnSecondsOf, useGameStore } from '../store/useGameStore'

const DRIVER_INTERVAL_MS = 100

// Runs the clock-driven transitions (time up, hand-off, next team) outside any screen,
// so the game keeps moving even while the teacher is looking at the leaderboard.
export function useGameDriver(theIsController: boolean): void {
  useEffect(() => {
    if (!theIsController) {
      return
    }
    let theLastTickSecond = -1
    let theLastCountdownSecond = -1
    let theWentLive = ''
    let theDeadlineTimer = 0
    function step() {
      const theState = useGameStore.getState()
      const theGame = theState.game
      const theNow = Date.now()
      setMuted(!theState.settings.sound)
      if (theGame.phase === 'live' && theGame.turn !== null) {
        const theTurn = theGame.turn
        if (theTurn.end === null && theTurn.pausedAt === null) {
          if (theNow < theTurn.startedAt) {
            const theCountdownSecond = Math.ceil((theTurn.startedAt - theNow) / 1000)
            if (theCountdownSecond !== theLastCountdownSecond && theCountdownSecond <= COUNTDOWN_MS / 1000) {
              theLastCountdownSecond = theCountdownSecond
              playCountdownBeep()
            }
          } else {
            if (theWentLive !== theTurn.turnId) {
              theWentLive = theTurn.turnId
              if (theState.settings.countdown && theNow - theTurn.startedAt < 400) {
                playGoBeep()
              }
            }
            const theMs = remainingMs(theTurn.startedAt, null, theNow, turnSecondsOf(theTurn, theState.settings))
            const theSeconds = secondsLeftFromMs(theMs)
            if (theMs <= 0) {
              theState.timeUp(theNow)
            } else if (theMs < DRIVER_INTERVAL_MS * 2 && theDeadlineTimer === 0) {
              // The interval alone lands up to 100 ms late; a one-off timeout hits the buzzer on time.
              theDeadlineTimer = window.setTimeout(() => {
                theDeadlineTimer = 0
                step()
              }, theMs)
            } else if (theSeconds <= RED_AT_SECONDS && theSeconds !== theLastTickSecond) {
              theLastTickSecond = theSeconds
              if (theSeconds <= 2) {
                playFinalTick()
              } else {
                playTick()
              }
            }
          }
        }
        if (theTurn.end !== null && theState.settings.autoAdvance && theNow - theTurn.end.at >= RESULT_BANNER_MS) {
          theState.nextTeam(theNow)
        }
      }
      if (theGame.phase === 'teamup' && theGame.handoffEndsAt !== null && !theGame.handoffHeld && theNow >= theGame.handoffEndsAt) {
        theState.startTurn(theNow)
      }
    }
    const theTimer = window.setInterval(step, DRIVER_INTERVAL_MS)
    // Background tabs throttle intervals, so re-check the instant the tab is visible again.
    document.addEventListener('visibilitychange', step)
    return () => {
      window.clearInterval(theTimer)
      window.clearTimeout(theDeadlineTimer)
      document.removeEventListener('visibilitychange', step)
    }
  }, [theIsController])
}

// Sounds and confetti react to store changes so a key press, a click, and a projector window all behave the same.
export function useGameReactions(thePlaySound: boolean): void {
  useEffect(() => {
    const theUnsubscribe = useGameStore.subscribe((theState, thePrev) => {
      const theGame = theState.game
      const thePrevGame = thePrev.game
      const theSound = thePlaySound && theState.settings.sound
      if (theGame.id !== thePrevGame.id) {
        return
      }
      if (theGame.history.length === thePrevGame.history.length + 1) {
        const theRow = theGame.history[theGame.history.length - 1]
        if (theRow.outcome === 'correct') {
          if (theSound) {
            playChime()
          }
          const theTeam = currentTeamOf(theState.teams, theGame)
          let theColor = '#fed141'
          if (theTeam !== null) {
            theColor = theTeam.color
          }
          burstConfetti(theColor)
        }
        if (theRow.outcome === 'skip' && theSound) {
          playSkip()
        }
      }
      const theEnd = theGame.turn?.end ?? null
      const thePrevEnd = thePrevGame.turn?.end ?? null
      if (theEnd !== null && thePrevEnd === null && theEnd.outcome !== 'correct' && theSound) {
        playBuzzer()
      }
      if (theGame.phase === 'podium' && thePrevGame.phase !== 'podium') {
        if (theSound) {
          playFanfare()
        }
        podiumConfetti()
      }
    })
    return theUnsubscribe
  }, [thePlaySound])
}
