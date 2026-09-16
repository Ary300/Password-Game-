import confetti from 'canvas-confetti'

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function burstConfetti(theTeamColor: string): void {
  if (reducedMotion()) {
    return
  }
  const theColors = ['#c63527', '#fed141', '#fbf3ea', theTeamColor]
  confetti({ particleCount: 90, spread: 80, startVelocity: 48, origin: { x: 0.5, y: 0.45 }, colors: theColors, scalar: 1.2 })
}

export function podiumConfetti(): void {
  if (reducedMotion()) {
    return
  }
  const theColors = ['#c63527', '#fed141', '#fbf3ea']
  confetti({ particleCount: 140, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: theColors })
  confetti({ particleCount: 140, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: theColors })
}
