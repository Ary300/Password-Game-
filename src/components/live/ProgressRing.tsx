type ProgressRingProps = {
  fraction: number
  color: string
  strokeWidth?: number
  className?: string
}

// pathLength of 1 lets the dash offset be the fraction itself, so the ring drains without any trigonometry.
export default function ProgressRing({ fraction, color, strokeWidth = 5, className = '' }: ProgressRingProps) {
  const theFraction = Math.min(1, Math.max(0, fraction))
  const theRadius = 50 - strokeWidth / 2 - 1
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r={theRadius} fill="none" stroke="var(--ring-track)" strokeWidth={strokeWidth} />
      <circle
        cx="50"
        cy="50"
        r={theRadius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - theFraction}
        transform="rotate(-90 50 50)"
      />
    </svg>
  )
}
