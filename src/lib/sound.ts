// All sounds are synthesized with Web Audio so there are no files to load or license.
let theContext: AudioContext | null = null
let theMuted = false

export function setMuted(theValue: boolean): void {
  theMuted = theValue
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || theMuted) {
    return null
  }
  if (theContext === null) {
    const theCtor = window.AudioContext
    if (theCtor === undefined) {
      return null
    }
    theContext = new theCtor()
  }
  // Browsers start the context suspended until a user gesture; resuming on each call recovers after the first key press.
  if (theContext.state === 'suspended') {
    theContext.resume().catch(() => undefined)
  }
  return theContext
}

type ToneOptions = {
  frequency: number
  endFrequency?: number
  duration: number
  type: OscillatorType
  volume: number
  delay?: number
}

function tone(theOptions: ToneOptions): void {
  const theCtx = audio()
  if (theCtx === null) {
    return
  }
  const theStart = theCtx.currentTime + (theOptions.delay ?? 0)
  const theOsc = theCtx.createOscillator()
  const theGain = theCtx.createGain()
  theOsc.type = theOptions.type
  theOsc.frequency.setValueAtTime(theOptions.frequency, theStart)
  if (theOptions.endFrequency !== undefined) {
    theOsc.frequency.exponentialRampToValueAtTime(theOptions.endFrequency, theStart + theOptions.duration)
  }
  theGain.gain.setValueAtTime(0.0001, theStart)
  theGain.gain.exponentialRampToValueAtTime(theOptions.volume, theStart + 0.01)
  theGain.gain.exponentialRampToValueAtTime(0.0001, theStart + theOptions.duration)
  theOsc.connect(theGain)
  theGain.connect(theCtx.destination)
  theOsc.start(theStart)
  theOsc.stop(theStart + theOptions.duration + 0.05)
}

export function playTick(): void {
  tone({ frequency: 1250, duration: 0.06, type: 'square', volume: 0.08 })
}

export function playFinalTick(): void {
  tone({ frequency: 1650, duration: 0.09, type: 'square', volume: 0.12 })
}

export function playCountdownBeep(): void {
  tone({ frequency: 660, duration: 0.14, type: 'sine', volume: 0.25 })
}

export function playGoBeep(): void {
  tone({ frequency: 990, duration: 0.3, type: 'sine', volume: 0.3 })
}

// The time-up buzzer: two detuned sawtooth layers read as an arena horn from the back of a classroom.
export function playBuzzer(): void {
  tone({ frequency: 150, endFrequency: 110, duration: 1.1, type: 'sawtooth', volume: 0.32 })
  tone({ frequency: 155, endFrequency: 114, duration: 1.1, type: 'sawtooth', volume: 0.25 })
  tone({ frequency: 75, duration: 1.1, type: 'square', volume: 0.12 })
}

export function playChime(): void {
  tone({ frequency: 784, duration: 0.18, type: 'triangle', volume: 0.3 })
  tone({ frequency: 1047, duration: 0.22, type: 'triangle', volume: 0.3, delay: 0.09 })
  tone({ frequency: 1568, duration: 0.45, type: 'triangle', volume: 0.22, delay: 0.18 })
}

export function playSkip(): void {
  tone({ frequency: 520, endFrequency: 260, duration: 0.22, type: 'triangle', volume: 0.2 })
}

export function playFanfare(): void {
  const theNotes = [523, 659, 784, 1047]
  for (let n = 0; n < theNotes.length; n++) {
    tone({ frequency: theNotes[n], duration: 0.35, type: 'triangle', volume: 0.25, delay: n * 0.14 })
  }
}
